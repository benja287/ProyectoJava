package ar.edu.unlp.jyaa.grupo1.modelo;

import java.util.List;

/** Ejes temáticos oficiales del congreso (V CAAE UNLP 2027). */
public final class EjesTematicos {

  public static final String DISENO_SISTEMAS =
      "Diseño y manejo de sistemas productivos agroecológicos";
  public static final String FORMACION_SABERES =
      "Formación y construcción de saberes agroecológicos";
  public static final String METODOLOGIAS = "Metodologías de análisis y diagnóstico";
  public static final String SEMILLAS_BIODIVERSIDAD =
      "Semillas, agrobiodiversidad y servicios ecosistémicos";
  public static final String SALUD_NUTRICION = "Salud, nutrición y agroecología";
  public static final String ECONOMIA_COMERCIALIZACION =
      "Economía, valor agregado y comercialización";
  public static final String PLANIFICACION_TERRITORIAL =
      "Planificación y desarrollo territorial";
  public static final String PUEBLOS_GENEROS_JUVENTUDES =
      "Pueblos indígenas, géneros y juventudes";
  public static final String POLITICAS_MOVIMIENTOS =
      "Políticas públicas, movimientos sociales e institucionalidades";

  private static final List<String> TODOS =
      List.of(
          DISENO_SISTEMAS,
          FORMACION_SABERES,
          METODOLOGIAS,
          SEMILLAS_BIODIVERSIDAD,
          SALUD_NUTRICION,
          ECONOMIA_COMERCIALIZACION,
          PLANIFICACION_TERRITORIAL,
          PUEBLOS_GENEROS_JUVENTUDES,
          POLITICAS_MOVIMIENTOS);

  private EjesTematicos() {}

  public static List<String> todos() {
    return TODOS;
  }

  public static boolean esValido(String eje) {
    if (eje == null || eje.isBlank()) {
      return false;
    }
    return TODOS.contains(eje.trim());
  }
}
