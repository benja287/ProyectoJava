package ar.edu.unlp.jyaa.grupo1.modelo;

/**
 * Reglas centralizadas por categoría tarifaria (evita branching hardcodeado en UI/servicio).
 */
public final class ReglasInscripcion {

  private ReglasInscripcion() {}

  public record ReglasCategoria(
      boolean requiereCertificado,
      boolean requierePago,
      boolean requiereInstitucion,
      boolean requiereComprobanteSiTransferencia,
      /** Destaca filiación institucional (p. ej. no socio / extranjero). */
      boolean destacaFiliacionInstitucional,
      String ayuda) {}

  public static ReglasCategoria de(CategoriaInscripcion categoria) {
    if (categoria == null) {
      throw new IllegalArgumentException("Categoría requerida");
    }
    boolean certificado = categoria.requiereCertificado();
    boolean destacaFiliacion =
        categoria == CategoriaInscripcion.NO_SOCIO || categoria == CategoriaInscripcion.EXTRANJERO;
    String ayuda =
        switch (categoria) {
          case SOCIO_SAAE ->
              "Adjuntá constancia de socix SAAE. El arancel preferencial aplica con certificado válido.";
          case NO_SOCIO ->
              "Completá filiación institucional y el pago correspondiente. No requiere certificado de categoría.";
          case ESTUDIANTE ->
              "Adjuntá certificado de alumno regular. El arancel estudiantil requiere esa constancia.";
          case PRODUCTOR ->
              "Adjuntá constancia de organización/comunidad productora.";
          case INVESTIGADOR, EXTENSIONISTA, DOCENTE ->
              "Adjuntá constancia institucional que acredite la categoría.";
          case EXTRANJERO ->
              "Completá filiación institucional y el pago en USD. No requiere certificado de categoría local.";
        };
    return new ReglasCategoria(
        certificado,
        true,
        true,
        true,
        destacaFiliacion,
        ayuda);
  }
}
