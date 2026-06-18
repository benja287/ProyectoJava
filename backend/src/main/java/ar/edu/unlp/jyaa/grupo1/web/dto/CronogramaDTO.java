package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.CronogramaPersonal;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import java.util.List;

public record CronogramaDTO(
    Long id, Long usuarioId, String usuarioNombre, String usuarioApellido, List<ActividadResumenDTO> actividades) {

  public static CronogramaDTO from(CronogramaPersonal c) {
    Usuario u = c.getUsuario();
    return new CronogramaDTO(
        c.getId(),
        u != null ? u.getId() : null,
        u != null ? u.getNombre() : null,
        u != null ? u.getApellido() : null,
        c.getActividades().stream().map(ActividadResumenDTO::from).toList());
  }
}
