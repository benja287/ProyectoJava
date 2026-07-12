package ar.edu.unlp.jyaa.grupo1.util;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Fechas hábiles del evento (3 días). Preferir {@link #fechasDelEvento(LocalDate, LocalDate)} con
 * la config del congreso; el fallback hardcodeado se usa solo si aún no hay fechas configuradas.
 */
public final class FechasCongreso {

  public static final int DIAS_CONGRESO = 3;

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

  /**
   * Día lógico 1..N a partir del inicio del congreso. Devuelve {@code null} si no se puede
   * calcular o queda fuera del rango de {@link #DIAS_CONGRESO} días.
   */
  public static Integer numeroDia(LocalDate fecha, LocalDate congresoDesde) {
    if (fecha == null || congresoDesde == null) {
      return null;
    }
    long dia = ChronoUnit.DAYS.between(congresoDesde, fecha) + 1;
    if (dia < 1 || dia > DIAS_CONGRESO) {
      return null;
    }
    return (int) dia;
  }

  /** Fecha de calendario del día lógico (1 = inicio). */
  public static LocalDate fechaDeDia(LocalDate congresoDesde, int diaCongreso) {
    if (congresoDesde == null || diaCongreso < 1) {
      return null;
    }
    return congresoDesde.plusDays(diaCongreso - 1L);
  }
}
