package ar.edu.unlp.jyaa.grupo1.web.dto;

import java.time.LocalDateTime;

public record ArqueoCajaItemDTO(
    Long pagoId,
    double monto,
    String numeroRecibo,
    LocalDateTime fechaValidacion,
    String validadoPorNombre,
    boolean efectivoFisicoRecibido,
    String observaciones) {}
