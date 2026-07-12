package ar.edu.unlp.jyaa.grupo1.rest.dto;

public record CrearTallerOficialRequest(
    String titulo,
    String fecha,
    String horaInicio,
    String horaFin,
    String sala,
    String responsables,
    String descripcion,
    Long propuestaTallerId,
    Long aulaId) {}
