package ar.edu.unlp.jyaa.grupo1.modelo;

/** Códigos de modalidad conocidos por el sistema (catálogo configurable). */
public enum ModalidadPresentacion {
  ORAL,
  POSTER;

  public static boolean esOral(String codigo) {
    return ORAL.name().equalsIgnoreCase(normalizar(codigo));
  }

  public static boolean esPoster(String codigo) {
    return POSTER.name().equalsIgnoreCase(normalizar(codigo));
  }

  public static String normalizar(String codigo) {
    return codigo == null ? null : codigo.trim();
  }
}
