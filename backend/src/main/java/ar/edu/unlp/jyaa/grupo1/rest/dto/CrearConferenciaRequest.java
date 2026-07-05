package ar.edu.unlp.jyaa.grupo1.rest.dto;

public record CrearConferenciaRequest(
    String titulo,
    String fecha,
    String horaInicio,
    String horaFin,
    String sala,
    String conferencistas,
    String moderador,
    String institucion,
    String descripcion) {}
