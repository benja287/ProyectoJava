package ar.edu.unlp.jyaa.grupo1.rest.dto;

import java.time.LocalDateTime;

public record ActualizarActividadProgramaRequest(
    String titulo,
    String sala,
    LocalDateTime inicio,
    LocalDateTime fin,
    String codigo,
    String descripcion,
    String ejeTematico,
    String moderador,
    String panelistas,
    String responsables,
    String conferencistas,
    String institucion) {}
