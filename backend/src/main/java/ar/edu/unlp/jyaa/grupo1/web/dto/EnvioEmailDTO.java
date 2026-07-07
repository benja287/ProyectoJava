package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.EnvioEmail;
import java.time.LocalDateTime;

public record EnvioEmailDTO(
    Long id,
    String destinatario,
    String asunto,
    String cuerpo,
    LocalDateTime fechaEnvio,
    boolean enviado,
    String error) {

  public static EnvioEmailDTO from(EnvioEmail e) {
    return new EnvioEmailDTO(
        e.getId(),
        e.getDestinatario(),
        e.getAsunto(),
        e.getCuerpo(),
        e.getFechaEnvio(),
        e.isEnviado(),
        e.getError());
  }
}
