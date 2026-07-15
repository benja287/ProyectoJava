package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Notificacion;
import java.time.LocalDateTime;

public record NotificacionAdminDTO(
    Long id,
    String asunto,
    String mensaje,
    LocalDateTime fechaCreacion,
    boolean leida,
    String enlace,
    Long usuarioId,
    String usuarioNombre,
    String usuarioEmail) {

  public static NotificacionAdminDTO from(Notificacion n) {
    var u = n.getUsuario();
    return new NotificacionAdminDTO(
        n.getId(),
        n.getAsunto(),
        n.getMensaje(),
        n.getFechaCreacion(),
        n.isLeida(),
        n.getEnlace(),
        u != null ? u.getId() : null,
        u != null ? u.getNombre() : null,
        u != null ? u.getEmail() : null);
  }
}
