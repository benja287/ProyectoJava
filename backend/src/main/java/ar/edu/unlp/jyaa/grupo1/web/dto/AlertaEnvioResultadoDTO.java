package ar.edu.unlp.jyaa.grupo1.web.dto;

/** Resultado de disparar alertas pre-congreso / recordatorios. */
public record AlertaEnvioResultadoDTO(
    int notificacionesOrganizacion,
    int recordatoriosUsuarios,
    String mensaje) {}
