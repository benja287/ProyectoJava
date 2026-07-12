package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoActividad;
import java.time.LocalDateTime;
import java.util.List;

public record ActividadCronogramaDTO(
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
    String institucion,
    Integer diaCongreso,
    Long aulaId,
    List<TrabajoCronogramaItemDTO> trabajos) {

  public static ActividadCronogramaDTO from(Actividad a) {
    List<TrabajoCronogramaItemDTO> trabajos =
        a.getTrabajos() == null
            ? List.of()
            : a.getTrabajos().stream().map(TrabajoCronogramaItemDTO::from).toList();
    return new ActividadCronogramaDTO(
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
        a.getInstitucion(),
        a.getDiaCongreso(),
        a.getAula() != null ? a.getAula().getId() : null,
        trabajos);
  }
}
