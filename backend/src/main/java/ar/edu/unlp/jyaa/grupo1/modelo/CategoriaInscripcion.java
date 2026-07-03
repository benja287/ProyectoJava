package ar.edu.unlp.jyaa.grupo1.modelo;

import java.util.Set;

/** Categorías tarifarias de inscripción al congreso. */
public enum CategoriaInscripcion {
  SOCIO_SAAE,
  NO_SOCIO,
  ESTUDIANTE,
  PRODUCTOR,
  INVESTIGADOR,
  EXTENSIONISTA,
  DOCENTE,
  EXTRANJERO;

  private static final Set<CategoriaInscripcion> REQUIEREN_CERTIFICADO =
      Set.of(SOCIO_SAAE, ESTUDIANTE, PRODUCTOR, INVESTIGADOR, EXTENSIONISTA, DOCENTE);

  public boolean requiereCertificado() {
    return REQUIEREN_CERTIFICADO.contains(this);
  }

  public static CategoriaInscripcion parse(String value) {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException("Categoría requerida");
    }
    return CategoriaInscripcion.valueOf(value.trim().toUpperCase());
  }
}
