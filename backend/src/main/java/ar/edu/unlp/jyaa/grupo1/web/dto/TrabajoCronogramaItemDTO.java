package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;

public record TrabajoCronogramaItemDTO(
    Long id,
    String titulo,
    String ejeTematico,
    String tipo,
    String modalidad,
    Long autorId,
    String autorNombre,
    String autorApellido) {

  public static TrabajoCronogramaItemDTO from(Trabajo t) {
    Usuario autor = t.getAutor();
    return new TrabajoCronogramaItemDTO(
        t.getId(),
        t.getTitulo(),
        t.getEjeTematico(),
        t.getTipo(),
        t.getModalidad(),
        autor != null ? autor.getId() : null,
        autor != null ? autor.getNombre() : null,
        autor != null ? autor.getApellido() : null);
  }
}
