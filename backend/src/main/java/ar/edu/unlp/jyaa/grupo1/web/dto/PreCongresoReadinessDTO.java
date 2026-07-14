package ar.edu.unlp.jyaa.grupo1.web.dto;

import java.util.List;

/** Checklist "¿todo listo antes de empezar?" para admin y comité. */
public record PreCongresoReadinessDTO(
    boolean listo,
    boolean programaPublicado,
    long trabajosPendientesPrecheck,
    long trabajosPendientesAprobacionComite,
    long trabajosEnEvaluacion,
    long evaluacionesPendientes,
    long invitacionesEvaluacionPendientes,
    long inscripcionesPendientes,
    List<String> alertas) {}
