package ar.edu.unlp.jyaa.grupo1.modelo;

/** Códigos de tipo de envío conocidos por el sistema (catálogo configurable). */
public enum TipoTrabajo {
  TRABAJO_CIENTIFICO,
  RELATO_DE_EXPERIENCIA,
  PROPUESTA_TALLER;

  public static boolean esPropuestaTaller(String codigo) {
    return PROPUESTA_TALLER.name().equalsIgnoreCase(normalizar(codigo));
  }

  public static String normalizar(String codigo) {
    return codigo == null ? null : codigo.trim();
  }
}
