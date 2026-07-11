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
    /** Motivo obligatorio al cambiar ventanas (se incluye en la notificación). */
    String motivo,
    /**
     * Independiza cada guardado: CONGRESO | INSCRIPCIONES | ENVIO | EVALUACION. Null = updates
     * legacy (programa, certificados o deadline de envío del comité).
     */
    String grupo) {}
