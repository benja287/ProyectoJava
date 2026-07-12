package ar.edu.unlp.jyaa.grupo1.rest.dto;

public record CrearMesaRedondaRequest(
    String titulo,
    String ejeTematico,
    String moderador,
    String panelistas,
    String descripcion,
    String sala,
    String fecha,
    String horaInicio,
    String horaFin,
    Long aulaId) {}
