package ar.edu.unlp.jyaa.grupo1.web.dto;

/** Preview del próximo recibo de caja (no consume el correlativo). */
public record ProximoReciboDTO(String numeroRecibo, int anio, int correlativo) {}
