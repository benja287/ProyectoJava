package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoActividad;
import java.time.LocalDateTime;

/** Vista resumida de actividad para API (sin lista de trabajos ni relaciones circulares). */
public record ActividadResumenDTO(
    Long id,
    String titulo,
    String sala,
    LocalDateTime inicio,
    LocalDateTime fin,
    TipoActividad tipoActividad,
    String codigo,
    String descripcion,
    String ejeTematico,
    String moderador,
    String panelistas,
    String responsables,
    String conferencistas,
    String institucion) {

  public static ActividadResumenDTO from(Actividad a) {
    return new ActividadResumenDTO(
        a.getId(),
        a.getTitulo(),
        a.getSala(),
        a.getInicio(),
        a.getFin(),
        a.getTipoActividad(),
        a.getCodigo(),
        a.getDescripcion(),
        a.getEjeTematico(),
        a.getModerador(),
        a.getPanelistas(),
        a.getResponsables(),
        a.getConferencistas(),
        a.getInstitucion());
  }
}
