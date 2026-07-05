package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Notificacion;
import java.time.LocalDateTime;

public record NotificacionDTO(
    Long id, String asunto, String mensaje, LocalDateTime fechaCreacion, boolean leida) {

  public static NotificacionDTO from(Notificacion n) {
    return new NotificacionDTO(
        n.getId(), n.getAsunto(), n.getMensaje(), n.getFechaCreacion(), n.isLeida());
  }
}
