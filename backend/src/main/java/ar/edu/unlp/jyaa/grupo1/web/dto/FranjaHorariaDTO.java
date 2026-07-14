package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.FranjaHoraria;
import java.time.LocalTime;

public record FranjaHorariaDTO(
    Long id,
    int diaCongreso,
    String etiqueta,
    String horaInicio,
    String horaFin,
    boolean activa) {

  public static FranjaHorariaDTO from(FranjaHoraria f) {
    return new FranjaHorariaDTO(
        f.getId(),
        f.getDiaCongreso(),
        f.getEtiqueta(),
        formatearHora(f.getHoraInicio()),
        formatearHora(f.getHoraFin()),
        f.isActiva());
  }

  private static String formatearHora(LocalTime t) {
    if (t == null) {
      return null;
    }
    return String.format("%02d:%02d", t.getHour(), t.getMinute());
  }
}
