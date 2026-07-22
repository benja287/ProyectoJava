package ar.edu.unlp.jyaa.grupo1.modelo;

/**
 * Códigos especiales / conocidos de modalidad recomendada en el dictamen. Las modalidades del
 * catálogo del congreso (ORAL, POSTER, VIRTUAL, …) también son válidas como String.
 */
public final class ModalidadRecomendadaEvaluacion {

  public static final String ORAL = "ORAL";
  public static final String POSTER = "POSTER";
  /** Sin preferencia de modalidad (opción fija del dictamen). */
  public static final String INDECISO = "INDECISO";

  private ModalidadRecomendadaEvaluacion() {}

  public static boolean esIndeciso(String codigo) {
    return INDECISO.equalsIgnoreCase(normalizar(codigo));
  }

  public static String normalizar(String codigo) {
    return codigo == null ? null : codigo.trim().toUpperCase();
  }
}
