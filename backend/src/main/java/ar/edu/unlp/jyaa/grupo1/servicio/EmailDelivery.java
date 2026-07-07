package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.config.MailConfig;
import ar.edu.unlp.jyaa.grupo1.dao.DAOFactory;
import ar.edu.unlp.jyaa.grupo1.dao.EnvioEmailDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.EnvioEmail;
import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.Properties;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Envío SMTP y registro en {@code envios_email}. Usa DAO legacy para poder ejecutarse fuera del
 * request HTTP (correos en segundo plano).
 */
@ApplicationScoped
public class EmailDelivery {

  private static final Logger log = LoggerFactory.getLogger(EmailDelivery.class);
  private static final int SMTP_TIMEOUT_MS = 15_000;

  private final ExecutorService executor = Executors.newFixedThreadPool(2);

  @Inject private MailConfig mailConfig;

  public boolean entregar(String destinatario, String asunto, String cuerpo) {
    return entregarYRegistrar(destinatario, asunto, cuerpo);
  }

  public void entregarEnSegundoPlano(String destinatario, String asunto, String cuerpo) {
    executor.execute(() -> entregarYRegistrar(destinatario, asunto, cuerpo));
  }

  @PreDestroy
  void cerrar() {
    executor.shutdown();
  }

  private boolean entregarYRegistrar(String destinatario, String asunto, String cuerpo) {
    EnvioEmail registro = new EnvioEmail();
    registro.setDestinatario(destinatario != null ? destinatario.trim() : "");
    registro.setAsunto(asunto != null ? asunto.trim() : "");
    registro.setCuerpo(cuerpo != null ? cuerpo.trim() : "");
    registro.setFechaEnvio(LocalDateTime.now());
    registro.setEnviado(false);

    EnvioEmailDAO envioEmailDAO = DAOFactory.getEnvioEmailDAO();

    if (registro.getDestinatario().isBlank()) {
      registro.setError("destinatario_vacio");
      envioEmailDAO.alta(registro);
      return false;
    }

    if (!mailConfig.isConfigured()) {
      registro.setError("smtp_no_configurado");
      envioEmailDAO.alta(registro);
      log.debug("Correo no enviado (SMTP sin credenciales): {}", registro.getDestinatario());
      return false;
    }

    try {
      enviarSmtp(registro.getDestinatario(), registro.getAsunto(), registro.getCuerpo());
      registro.setEnviado(true);
      registro.setError(null);
      log.info("Correo enviado a {}", registro.getDestinatario());
    } catch (MessagingException e) {
      registro.setError(truncarError(e.getMessage()));
      log.warn("Fallo al enviar correo a {}: {}", registro.getDestinatario(), e.getMessage());
    }

    envioEmailDAO.alta(registro);
    return registro.isEnviado();
  }

  private void enviarSmtp(String destinatario, String asunto, String cuerpo)
      throws MessagingException {
    Properties props = new Properties();
    props.put("mail.smtp.host", mailConfig.getHost());
    props.put("mail.smtp.port", String.valueOf(mailConfig.getPort()));
    props.put("mail.smtp.auth", String.valueOf(mailConfig.isSmtpAuth()));
    props.put("mail.smtp.starttls.enable", String.valueOf(mailConfig.isStartTls()));
    props.put("mail.smtp.starttls.required", String.valueOf(mailConfig.isStartTlsRequired()));
    props.put("mail.smtp.connectiontimeout", String.valueOf(SMTP_TIMEOUT_MS));
    props.put("mail.smtp.timeout", String.valueOf(SMTP_TIMEOUT_MS));
    props.put("mail.smtp.writetimeout", String.valueOf(SMTP_TIMEOUT_MS));

    Session session = Session.getInstance(props);
    MimeMessage message = new MimeMessage(session);
    message.setFrom(new InternetAddress(mailConfig.getFrom()));
    message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(destinatario, false));
    message.setSubject(asunto, "UTF-8");
    message.setText(cuerpo, "UTF-8");
    message.setSentDate(new java.util.Date());

    try (Transport transport = session.getTransport("smtp")) {
      transport.connect(
          mailConfig.getHost(),
          mailConfig.getPort(),
          mailConfig.getUsername(),
          mailConfig.getPassword());
      transport.sendMessage(message, message.getAllRecipients());
    }
  }

  private static String truncarError(String error) {
    if (error == null) {
      return "error_desconocido";
    }
    return error.length() <= 500 ? error : error.substring(0, 500);
  }
}
