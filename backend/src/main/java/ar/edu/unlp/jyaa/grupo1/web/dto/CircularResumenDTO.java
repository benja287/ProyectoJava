package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Circular;
import java.time.LocalDate;

public record CircularResumenDTO(
    Long id, String titulo, String contenido, boolean publicada, LocalDate fechaPublicacion) {

  public static CircularResumenDTO from(Circular c) {
    return new CircularResumenDTO(
        c.getId(), c.getTitulo(), c.getContenido(), c.isPublicada(), c.getFechaPublicacion());
  }
}
