package ar.edu.unlp.jyaa.grupo1.web.dto;

public record AdminStatsDTO(
    long totalUsuarios,
    long inscripcionesPendientesPago,
    long inscripcionesConfirmadas,
    long trabajosPresentados,
    long trabajosAprobados,
    long propuestasTallerPendientes) {}
