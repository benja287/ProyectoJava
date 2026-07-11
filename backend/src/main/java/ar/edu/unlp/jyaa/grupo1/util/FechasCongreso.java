package ar.edu.unlp.jyaa.grupo1.util;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Fechas hábiles del evento (3 días). Preferir {@link #fechasDelEvento(LocalDate, LocalDate)} con
 * la config del congreso; el fallback hardcodeado se usa solo si aún no hay fechas configuradas.
 */
public final class FechasCongreso {

  /** Fallback histórico (V CAAE) si el admin aún no configuró congresoDesde/Hasta. */
  public static final List<LocalDate> FECHAS_FALLBACK =
      List.of(LocalDate.of(2027, 5, 10), LocalDate.of(2027, 5, 11), LocalDate.of(2027, 5, 12));

  private FechasCongreso() {}

  public static List<LocalDate> fechasDelEvento(LocalDate desde, LocalDate hasta) {
    if (desde == null || hasta == null) {
      return FECHAS_FALLBACK;
    }
    if (hasta.isBefore(desde)) {
      return List.of();
    }
    List<LocalDate> fechas = new ArrayList<>();
    for (LocalDate d = desde; !d.isAfter(hasta); d = d.plusDays(1)) {
      fechas.add(d);
    }
    return List.copyOf(fechas);
  }

  public static boolean esFechaValida(LocalDate fecha, LocalDate desde, LocalDate hasta) {
    return fecha != null && fechasDelEvento(desde, hasta).contains(fecha);
  }

  /** @deprecated Preferir {@link #esFechaValida(LocalDate, LocalDate, LocalDate)}. */
  public static boolean esFechaValida(LocalDate fecha) {
    return fecha != null && FECHAS_FALLBACK.contains(fecha);
  }
}
