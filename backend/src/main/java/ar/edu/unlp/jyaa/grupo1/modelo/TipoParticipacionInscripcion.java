package ar.edu.unlp.jyaa.grupo1.modelo;

import java.util.ArrayList;
import java.util.List;

/** Declaración inicial de participación en la inscripción (logística / admin). */
public enum TipoParticipacionInscripcion {
  PRESENTACION_TRABAJO,
  EXPOSITOR_MESA,
  EXPOSITOR_TALLER,
  FERIANTE,
  ASISTENTE,
  OTRO;

  public static TipoParticipacionInscripcion parse(String value) {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException("Tipo de participación inválido");
    }
    return TipoParticipacionInscripcion.valueOf(value.trim().toUpperCase());
  }

  public static List<TipoParticipacionInscripcion> parseLista(List<String> valores) {
    List<TipoParticipacionInscripcion> out = new ArrayList<>();
    if (valores == null) {
      return out;
    }
    for (String v : valores) {
      if (v == null || v.isBlank()) {
        continue;
      }
      out.add(parse(v));
    }
    return out;
  }
}
