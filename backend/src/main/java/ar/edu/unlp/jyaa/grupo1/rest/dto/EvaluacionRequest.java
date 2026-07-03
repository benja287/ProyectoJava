package ar.edu.unlp.jyaa.grupo1.rest.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.RecomendacionEvaluacion;

public record EvaluacionRequest(
    Long asignacionId, RecomendacionEvaluacion recomendacion, String comentario) {}
