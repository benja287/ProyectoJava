package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadPresentacion;
import ar.edu.unlp.jyaa.grupo1.modelo.RecomendacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import java.time.LocalDate;
import java.util.List;

/** Vista resumida de un trabajo para listados (sin relaciones circulares ni password). */
public record TrabajoResumenDTO(
    Long id,
    String titulo,
    String resumen,
    String metodologia,
    String ejeTematico,
    ModalidadPresentacion modalidad,
    TipoTrabajo tipo,
    EstadoTrabajo estado,
    String documentoUrl,
    LocalDate fechaCreacion,
    List<String> coautores,
    Long autorId,
    String autorNombre,
    String autorApellido,
    String autorCategoria,
    int precheckIntentos,
    int revisionIntentos,
    String observacionesPrecheck,
    String rolEnvio,
    int asignacionesCount,
    int evaluacionesCompletas,
    int aprobaciones,
    int rechazos) {

  public static TrabajoResumenDTO from(Trabajo t) {
    return from(t, List.of());
  }

  public static TrabajoResumenDTO from(Trabajo t, List<AsignacionEvaluacion> asignaciones) {
    Usuario autor = t.getAutor();
    int asignacionesCount = asignaciones != null ? asignaciones.size() : 0;
    int evaluacionesCompletas = 0;
    int aprobaciones = 0;
    int rechazos = 0;
    if (asignaciones != null) {
      for (AsignacionEvaluacion a : asignaciones) {
        if (a.isAceptada() && a.getEvaluacion() != null) {
          evaluacionesCompletas++;
          RecomendacionEvaluacion rec = a.getEvaluacion().getRecomendacion();
          if (rec == RecomendacionEvaluacion.APROBADO
              || rec == RecomendacionEvaluacion.APROBADO_CON_CORRECCIONES) {
            aprobaciones++;
          } else if (rec == RecomendacionEvaluacion.RECHAZADO) {
            rechazos++;
          }
        }
      }
    }
    return new TrabajoResumenDTO(
        t.getId(),
        t.getTitulo(),
        t.getResumen(),
        t.getMetodologia(),
        t.getEjeTematico(),
        t.getModalidad(),
        t.getTipo(),
        t.getEstado(),
        t.getDocumentoUrl(),
        t.getFechaCreacion(),
        t.getCoautores(),
        autor != null ? autor.getId() : null,
        autor != null ? autor.getNombre() : null,
        autor != null ? autor.getApellido() : null,
        autor != null ? autor.getCategoriaInscripcion() : null,
        t.getPrecheckIntentos(),
        t.getRevisionIntentos(),
        t.getObservacionesPrecheck(),
        t.getRolEnvio() != null ? t.getRolEnvio().name() : null,
        asignacionesCount,
        evaluacionesCompletas,
        aprobaciones,
        rechazos);
  }
}
