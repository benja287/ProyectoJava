package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Circular;
import java.time.LocalDate;

public record CircularResumenDTO(
    Long id,
    String titulo,
    String resumen,
    String contenido,
    String documentoUrl,
    String documentoNombre,
    boolean publicada,
    LocalDate fechaPublicacion) {

  public static CircularResumenDTO from(Circular c) {
    return new CircularResumenDTO(
        c.getId(),
        c.getTitulo(),
        c.getResumen(),
        c.getContenido(),
        c.getDocumentoUrl(),
        c.getDocumentoNombre(),
        c.isPublicada(),
        c.getFechaPublicacion());
  }
}
