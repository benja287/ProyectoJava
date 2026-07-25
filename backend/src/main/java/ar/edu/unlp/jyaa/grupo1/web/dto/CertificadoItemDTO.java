package ar.edu.unlp.jyaa.grupo1.web.dto;

import java.util.List;

/**
 * Ítem imprimible del hub {@code /mis-certificados}.
 *
 * <p>Tipos: {@code ASISTENCIA}, {@code EVALUADOR}, {@code PRESENTACION}, {@code
 * PARTICIPACION_ACTIVIDADES}.
 */
public record CertificadoItemDTO(
    String tipo, String titulo, String detalle, List<String> lineas) {}
