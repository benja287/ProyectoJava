package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadPresentacion;
import ar.edu.unlp.jyaa.grupo1.modelo.RecomendacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoTrabajo;
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
    String trabajoEjeTematico,
    String trabajoDocumentoUrl,
    TipoTrabajo trabajoTipo,
    ModalidadPresentacion trabajoModalidad,
    String trabajoResumen,
    String trabajoMetodologia,
    Long evaluadorId,
    String evaluadorNombre,
    String evaluadorApellido,
    RecomendacionEvaluacion evaluacionRecomendacion,
    String evaluacionComentario) {

  public static AsignacionEvaluacionDTO from(AsignacionEvaluacion a) {
    Trabajo t = a.getTrabajo();
    Usuario e = a.getEvaluador();
    var ev = a.getEvaluacion();
    return new AsignacionEvaluacionDTO(
        a.getId(),
        a.isAceptada(),
        a.getFechaRespuesta(),
        t != null ? t.getId() : null,
        t != null ? t.getTitulo() : null,
        t != null ? t.getEstado() : null,
        t != null ? t.getEjeTematico() : null,
        t != null ? t.getDocumentoUrl() : null,
        t != null ? t.getTipo() : null,
        t != null ? t.getModalidad() : null,
        t != null ? t.getResumen() : null,
        t != null ? t.getMetodologia() : null,
        e != null ? e.getId() : null,
        e != null ? e.getNombre() : null,
        e != null ? e.getApellido() : null,
        ev != null ? ev.getRecomendacion() : null,
        ev != null ? ev.getComentario() : null);
  }
}
