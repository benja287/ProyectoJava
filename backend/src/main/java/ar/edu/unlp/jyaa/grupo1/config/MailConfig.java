package ar.edu.unlp.jyaa.grupo1.config;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Carga propiedades SMTP con la misma convención que Spring Boot Mail ({@code spring.mail.*}).
 * El backend usa Jersey + CDI (no Spring); el envío se hace con Jakarta Mail (Angus).
 */
@ApplicationScoped
public class MailConfig {

  private static final Logger log = LoggerFactory.getLogger(MailConfig.class);

  private final Properties fileProps = new Properties();
  private String host;
  private int port;
  private String username;
  private String password;
  private String from;
  private String publicUrl;
  private boolean smtpAuth;
  private boolean startTls;
  private boolean startTlsRequired;

  @PostConstruct
  void init() {
    try (InputStream in =
        Thread.currentThread()
            .getContextClassLoader()
            .getResourceAsStream("application.properties")) {
      if (in != null) {
        fileProps.load(in);
      }
    } catch (IOException e) {
      log.warn("No se pudo leer application.properties: {}", e.getMessage());
    }

    host = resolve("spring.mail.host", "smtp.gmail.com");
    port = Integer.parseInt(resolve("spring.mail.port", "587"));
    username = resolve("spring.mail.username", "");
    password = resolve("spring.mail.password", "");
    from = resolve("spring.mail.from", username);
    publicUrl = resolve("app.public.url", "http://localhost:4200");
    smtpAuth = Boolean.parseBoolean(resolve("spring.mail.properties.mail.smtp.auth", "true"));
    startTls =
        Boolean.parseBoolean(resolve("spring.mail.properties.mail.smtp.starttls.enable", "true"));
    startTlsRequired =
        Boolean.parseBoolean(
            resolve("spring.mail.properties.mail.smtp.starttls.required", "true"));

    if (!isConfigured()) {
      log.warn(
          "SMTP no configurado (spring.mail.username / spring.mail.password vacíos). "
              + "Los correos se registrarán en envios_email como fallidos.");
    }
  }

  private String resolve(String key, String defaultValue) {
    String sys = System.getProperty(key);
    if (sys != null && !sys.isBlank()) {
      return sys.trim();
    }
    String envKey = key.replace('.', '_').toUpperCase();
    String env = System.getenv(envKey);
    if (env != null && !env.isBlank()) {
      return env.trim();
    }
    return fileProps.getProperty(key, defaultValue).trim();
  }

  public boolean isConfigured() {
    return username != null
        && !username.isBlank()
        && password != null
        && !password.isBlank();
  }

  public String getHost() {
    return host;
  }

  public int getPort() {
    return port;
  }

  public String getUsername() {
    return username;
  }

  public String getPassword() {
    return password;
  }

  public String getFrom() {
    return from != null && !from.isBlank() ? from : username;
  }

  public String getPublicUrl() {
    return publicUrl;
  }

  public boolean isSmtpAuth() {
    return smtpAuth;
  }

  public boolean isStartTls() {
    return startTls;
  }

  public boolean isStartTlsRequired() {
    return startTlsRequired;
  }
}
