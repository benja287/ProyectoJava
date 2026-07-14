package ar.edu.unlp.jyaa.grupo1.rest.dto;

public record FranjaHorariaRequest(
    Integer diaCongreso, String etiqueta, String horaInicio, String horaFin, Boolean activa) {}
