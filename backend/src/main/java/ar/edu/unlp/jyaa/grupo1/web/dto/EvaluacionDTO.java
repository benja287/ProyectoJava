package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Evaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.RecomendacionEvaluacion;
import java.time.LocalDate;

public record EvaluacionDTO(
    Long id,
    Long asignacionId,
    RecomendacionEvaluacion recomendacion,
    String comentario,
    LocalDate fecha) {

  public static EvaluacionDTO from(Evaluacion e) {
    return new EvaluacionDTO(
        e.getId(),
        e.getAsignacion() != null ? e.getAsignacion().getId() : null,
        e.getRecomendacion(),
        e.getComentario(),
        e.getFecha());
  }
}
