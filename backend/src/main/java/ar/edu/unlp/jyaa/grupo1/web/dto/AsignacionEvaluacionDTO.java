package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import java.time.LocalDate;

public record AsignacionEvaluacionDTO(
    Long id,
    boolean aceptada,
    LocalDate fechaRespuesta,
    Long trabajoId,
    String trabajoTitulo,
    EstadoTrabajo trabajoEstado,
    String trabajoDocumentoUrl,
    Long evaluadorId,
    String evaluadorNombre,
    String evaluadorApellido) {

  public static AsignacionEvaluacionDTO from(AsignacionEvaluacion a) {
    Trabajo t = a.getTrabajo();
    Usuario e = a.getEvaluador();
    return new AsignacionEvaluacionDTO(
        a.getId(),
        a.isAceptada(),
        a.getFechaRespuesta(),
        t != null ? t.getId() : null,
        t != null ? t.getTitulo() : null,
        t != null ? t.getEstado() : null,
        t != null ? t.getDocumentoUrl() : null,
        e != null ? e.getId() : null,
        e != null ? e.getNombre() : null,
        e != null ? e.getApellido() : null);
  }
}
