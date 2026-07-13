package ar.edu.unlp.jyaa.grupo1.rest.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadRecomendadaEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.RecomendacionEvaluacion;

/**
 * Dictamen del evaluador (rúbrica + decisión).
 *
 * <p>{@code comentario} = visible a autorxs; {@code comentarioComite} = interno.
 * {@code rubricaJson} = criterios Sí/No + sugerencias en JSON.
 */
public record EvaluacionRequest(
    Long asignacionId,
    RecomendacionEvaluacion recomendacion,
    String comentario,
    String comentarioComite,
    ModalidadRecomendadaEvaluacion modalidadRecomendada,
    String rubricaJson) {}
