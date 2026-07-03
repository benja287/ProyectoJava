package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadPresentacion;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import java.time.LocalDate;
import java.util.List;

/** Vista resumida de un trabajo para listados (sin relaciones circulares ni password). */
public record TrabajoResumenDTO(
    Long id,
    String titulo,
    String resumen,
    String ejeTematico,
    ModalidadPresentacion modalidad,
    TipoTrabajo tipo,
    EstadoTrabajo estado,
    String documentoUrl,
    LocalDate fechaCreacion,
    List<String> coautores,
    Long autorId,
    String autorNombre,
    String autorApellido,
    int precheckIntentos) {

  public static TrabajoResumenDTO from(Trabajo t) {
    Usuario autor = t.getAutor();
    return new TrabajoResumenDTO(
        t.getId(),
        t.getTitulo(),
        t.getResumen(),
        t.getEjeTematico(),
        t.getModalidad(),
        t.getTipo(),
        t.getEstado(),
        t.getDocumentoUrl(),
        t.getFechaCreacion(),
        t.getCoautores(),
        autor != null ? autor.getId() : null,
        autor != null ? autor.getNombre() : null,
        autor != null ? autor.getApellido() : null,
        t.getPrecheckIntentos());
  }
}
