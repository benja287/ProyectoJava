package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.CronogramaPersonal;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public record CronogramaDTO(
    Long id, Long usuarioId, String usuarioNombre, String usuarioApellido, List<ActividadResumenDTO> actividades) {

  public static CronogramaDTO from(CronogramaPersonal c) {
    return from(c, Collections.emptyMap());
  }

  public static CronogramaDTO from(CronogramaPersonal c, Map<Long, Long> ocupacionPorActividad) {
    Usuario u = c.getUsuario();
    Map<Long, Long> ocup =
        ocupacionPorActividad != null ? ocupacionPorActividad : Collections.emptyMap();
    return new CronogramaDTO(
        c.getId(),
        u != null ? u.getId() : null,
        u != null ? u.getNombre() : null,
        u != null ? u.getApellido() : null,
        c.getActividades().stream()
            .map(a -> ActividadResumenDTO.from(a, ocup.getOrDefault(a.getId(), 0L)))
            .toList());
  }
}
