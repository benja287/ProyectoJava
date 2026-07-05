package ar.edu.unlp.jyaa.grupo1.util;

import java.time.LocalDate;
import java.util.List;

public final class FechasCongreso {

  public static final List<LocalDate> FECHAS =
      List.of(LocalDate.of(2027, 5, 10), LocalDate.of(2027, 5, 11), LocalDate.of(2027, 5, 12));

  private FechasCongreso() {}

  public static boolean esFechaValida(LocalDate fecha) {
    return fecha != null && FECHAS.contains(fecha);
  }
}
