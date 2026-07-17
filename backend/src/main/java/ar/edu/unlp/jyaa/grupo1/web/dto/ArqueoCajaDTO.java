package ar.edu.unlp.jyaa.grupo1.web.dto;

import java.time.LocalDate;
import java.util.List;

/** Reporte de arqueo: efectivo aprobado en un rango de fechas de validación. */
public record ArqueoCajaDTO(
    LocalDate desde,
    LocalDate hasta,
    long cantidadPagos,
    double totalCobrado,
    List<ArqueoCajaItemDTO> items) {}
