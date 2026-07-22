package ar.edu.unlp.jyaa.grupo1.modelo;

import java.util.ArrayList;
import java.util.List;

/** Valores por defecto de catálogos (V CAAE UNLP). */
public final class CatalogosCongresoDefaults {

  private CatalogosCongresoDefaults() {}

  public static List<CatalogoItem> ejes() {
    List<String> textos = EjesTematicos.todos();
    List<CatalogoItem> out = new ArrayList<>();
    for (int i = 0; i < textos.size(); i++) {
      String t = textos.get(i);
      out.add(new CatalogoItem(t, t, i + 1, true));
    }
    return out;
  }

  public static List<CatalogoItem> modalidades() {
    List<CatalogoItem> out = new ArrayList<>();
    out.add(new CatalogoItem("ORAL", "Oral", 1, true, "MESA"));
    out.add(new CatalogoItem("POSTER", "Póster", 2, true, "POSTER"));
    return out;
  }

  public static List<CatalogoItem> tiposEnvio() {
    List<CatalogoItem> out = new ArrayList<>();
    out.add(new CatalogoItem("TRABAJO_CIENTIFICO", "Trabajo científico", 1, true));
    out.add(new CatalogoItem("RELATO_DE_EXPERIENCIA", "Relato de experiencia", 2, true));
    out.add(new CatalogoItem("PROPUESTA_TALLER", "Propuesta de taller", 3, true));
    return out;
  }
}
