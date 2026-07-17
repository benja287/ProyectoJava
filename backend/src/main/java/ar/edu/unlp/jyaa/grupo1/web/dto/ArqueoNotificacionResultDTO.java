package ar.edu.unlp.jyaa.grupo1.web.dto;

/** Resultado de avisar el arqueo de caja a administradores. */
public record ArqueoNotificacionResultDTO(
    int administradoresNotificados, String mensaje, ArqueoCajaDTO arqueo) {}
