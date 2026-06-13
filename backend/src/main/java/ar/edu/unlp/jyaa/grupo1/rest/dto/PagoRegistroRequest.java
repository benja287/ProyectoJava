package ar.edu.unlp.jyaa.grupo1.rest.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Pago;

public record PagoRegistroRequest(Long usuarioId, Pago pago) {}
