package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.ReglasInscripcion;

/** Reglas de UI/validación por categoría (espejo de {@link ReglasInscripcion}). */
public record ReglasCategoriaDTO(
    String categoria,
    boolean requiereCertificado,
    boolean requierePago,
    boolean requiereInstitucion,
    boolean requiereComprobanteSiTransferencia,
    boolean destacaFiliacionInstitucional,
    String ayuda) {

  public static ReglasCategoriaDTO from(
      String categoria, ReglasInscripcion.ReglasCategoria reglas) {
    return new ReglasCategoriaDTO(
        categoria,
        reglas.requiereCertificado(),
        reglas.requierePago(),
        reglas.requiereInstitucion(),
        reglas.requiereComprobanteSiTransferencia(),
        reglas.destacaFiliacionInstitucional(),
        reglas.ayuda());
  }
}
