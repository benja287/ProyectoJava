package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import java.util.List;

public record SolicitudAutorDTO(
    Long usuarioId,
    String nombre,
    String apellido,
    String email,
    List<TrabajoResumenDTO> trabajos) {

  public static SolicitudAutorDTO of(Usuario usuario, List<TrabajoResumenDTO> trabajos) {
    return new SolicitudAutorDTO(
        usuario.getId(),
        usuario.getNombre(),
        usuario.getApellido(),
        usuario.getEmail(),
        trabajos);
  }
}
