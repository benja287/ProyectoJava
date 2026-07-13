package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Evaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadRecomendadaEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.RecomendacionEvaluacion;
import java.time.LocalDate;

/**
 * Devolución segura para autor/asistente: sin identidad del evaluador ni comentario de comisión.
 */
public record DevolucionEvaluacionAutorDTO(
    Long evaluacionId,
    RecomendacionEvaluacion recomendacion,
    String comentario,
    ModalidadRecomendadaEvaluacion modalidadRecomendada,
    String rubricaJson,
    String archivoCorreccionUrl,
    String archivoCorreccionNombre,
    LocalDate fecha) {

  public static DevolucionEvaluacionAutorDTO from(Evaluacion e) {
    return new DevolucionEvaluacionAutorDTO(
        e.getId(),
        e.getRecomendacion(),
        e.getComentario(),
        e.getModalidadRecomendada(),
        e.getRubricaJson(),
        e.getArchivoCorreccionUrl(),
        e.getArchivoCorreccionNombre(),
        e.getFecha());
  }
}
