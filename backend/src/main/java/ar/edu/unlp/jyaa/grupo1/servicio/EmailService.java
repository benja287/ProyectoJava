package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.config.MailConfig;
import ar.edu.unlp.jyaa.grupo1.dao.EnvioEmailDAO;
import ar.edu.unlp.jyaa.grupo1.dao.PlantillaEmailDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.EnvioEmail;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Properties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RequestScoped
public class EmailService {

  private static final Logger log = LoggerFactory.getLogger(EmailService.class);

  @Inject private MailConfig mailConfig;
  @Inject private EnvioEmailDAO envioEmailDAO;
  @Inject private PlantillaEmailDAO plantillaEmailDAO;

  public record ContenidoEmail(String asunto, String cuerpo) {}

  public boolean enviar(String destinatario, String asunto, String cuerpo) {
    return enviarYRegistrar(destinatario, asunto, cuerpo);
  }

  public boolean enviarConPlantilla(
      String nombrePlantilla, String destinatario, Map<String, String> variables) {
    Optional<ContenidoEmail> contenido = renderizarPlantilla(nombrePlantilla, variables);
    if (contenido.isEmpty()) {
      registrarFallo(destinatario, nombrePlantilla, "Plantilla no encontrada: " + nombrePlantilla);
      return false;
    }
    return enviarYRegistrar(destinatario, contenido.get().asunto(), contenido.get().cuerpo());
  }

  public Optional<ContenidoEmail> renderizarPlantilla(
      String nombrePlantilla, Map<String, String> variables) {
    return plantillaEmailDAO
        .buscarPorNombre(nombrePlantilla)
        .map(
            plantilla ->
                new ContenidoEmail(
                    aplicarVariables(plantilla.getAsunto(), variables),
                    aplicarVariables(plantilla.getCuerpo(), variables)));
  }

  private boolean enviarYRegistrar(String destinatario, String asunto, String cuerpo) {
    EnvioEmail registro = new EnvioEmail();
    registro.setDestinatario(destinatario != null ? destinatario.trim() : "");
    registro.setAsunto(asunto != null ? asunto.trim() : "");
    registro.setCuerpo(cuerpo != null ? cuerpo.trim() : "");
    registro.setFechaEnvio(LocalDateTime.now());
    registro.setEnviado(false);

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

  private void registrarFallo(String destinatario, String asunto, String error) {
    EnvioEmail registro = new EnvioEmail();
    registro.setDestinatario(destinatario != null ? destinatario : "");
    registro.setAsunto(asunto != null ? asunto : "");
    registro.setCuerpo("");
    registro.setFechaEnvio(LocalDateTime.now());
    registro.setEnviado(false);
    registro.setError(truncarError(error));
    envioEmailDAO.alta(registro);
  }

  static String aplicarVariables(String texto, Map<String, String> variables) {
    if (texto == null || variables == null || variables.isEmpty()) {
      return texto != null ? texto : "";
    }
    String resultado = texto;
    for (Map.Entry<String, String> entry : variables.entrySet()) {
      String valor = entry.getValue() != null ? entry.getValue() : "";
      resultado = resultado.replace("{{" + entry.getKey() + "}}", valor);
    }
    return resultado;
  }

  private static String truncarError(String error) {
    if (error == null) {
      return "error_desconocido";
    }
    return error.length() <= 500 ? error : error.substring(0, 500);
  }
}
