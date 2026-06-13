package ar.edu.unlp.jyaa.grupo1.rest.dto;

public record ValidacionPagoRequest(boolean aprobar, String motivoRechazo, Double montoAjustado) {}
