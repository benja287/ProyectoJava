package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.AsignacionEvaluacionDAO;
import ar.edu.unlp.jyaa.grupo1.dao.EvaluacionDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.Evaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.RecomendacionEvaluacion;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.time.LocalDate;

@RequestScoped
public class EvaluacionService {

  @Inject private AsignacionEvaluacionDAO asignacionEvaluacionDAO;
  @Inject private EvaluacionDAO evaluacionDAO;
  @Inject private TrabajoService trabajoService;

  public Evaluacion registrar(Long asignacionId, RecomendacionEvaluacion recomendacion, String comentario) {
    AsignacionEvaluacion asignacion =
        asignacionEvaluacionDAO
            .recuperarPorIdConDetalle(asignacionId)
            .orElseThrow(() -> new NegocioException("Asignación no encontrada: " + asignacionId));
    if (!asignacion.isAceptada()) {
      throw new NegocioException("Debe aceptar la asignación antes de evaluar el trabajo");
    }
    if (asignacion.getEvaluacion() != null) {
      throw new NegocioException("Ya registró una evaluación para este trabajo");
    }
    if (asignacion.getTrabajo().getEstado() != ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo.EN_EVALUACION) {
      throw new NegocioException("El trabajo no está en evaluación");
    }

    Evaluacion evaluacion = new Evaluacion();
    evaluacion.setAsignacion(asignacion);
    evaluacion.setRecomendacion(recomendacion);
    evaluacion.setComentario(comentario);
    evaluacion.setFecha(LocalDate.now());
    asignacion.setEvaluacion(evaluacion);
    Evaluacion guardada = evaluacionDAO.alta(evaluacion);

    Long trabajoId = asignacion.getTrabajo().getId();
    trabajoService.actualizarEstadoTrasEvaluaciones(trabajoId);
    return guardada;
  }
}
