package ar.edu.unlp.jyaa.grupo1.dao.filtro;

import ar.edu.unlp.jyaa.grupo1.modelo.EstadoPago;

/** Filtros opcionales para listado de pagos. */
public record PagoFiltro(
    EstadoPago estado, Double monto, String motivoRechazo, Long usuarioId) {}
