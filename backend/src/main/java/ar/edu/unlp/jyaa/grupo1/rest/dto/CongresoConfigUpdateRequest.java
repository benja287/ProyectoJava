package ar.edu.unlp.jyaa.grupo1.rest.dto;

public record CongresoConfigUpdateRequest(
    Boolean programaPublicado,
    String certificadosDisponiblesDesde,
    String envioTrabajosHasta,
    String congresoDesde,
    String congresoHasta,
    String inscripcionesDesde,
    String inscripcionesHasta,
    String evaluacionHasta,
    /** Motivo obligatorio al cambiar ventanas de tiempo (se incluye en la notificación). */
    String motivo) {}
