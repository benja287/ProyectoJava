package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.AsignacionEvaluacionDAO;
import ar.edu.unlp.jyaa.grupo1.dao.TrabajoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.time.LocalDate;
import java.util.List;

@RequestScoped
public class AsignacionEvaluacionService {

  private static final int MAX_EVALUADORES = 2;

  @Inject private AsignacionEvaluacionDAO asignacionEvaluacionDAO;
  @Inject private TrabajoDAO trabajoDAO;
  @Inject private NotificacionService notificacionService;
  @Inject private UsuarioDAO usuarioDAO;

  public AsignacionEvaluacion asignar(Long trabajoId, Long evaluadorId) {
    Trabajo trabajo = trabajoDAO.recuperarPorId(trabajoId);
    if (trabajo == null) {
      throw new NegocioException("Trabajo no encontrado: " + trabajoId);
    }
    if (trabajo.getEstado() != EstadoTrabajo.PRECHECK_OK
        && trabajo.getEstado() != EstadoTrabajo.EN_EVALUACION) {
      throw new NegocioException(
          "Solo se pueden asignar evaluadores a trabajos con precheck OK o ya en evaluación");
    }
    Usuario evaluador = usuarioDAO.recuperarPorId(evaluadorId);
    if (evaluador == null) {
      throw new NegocioException("Evaluador no encontrado: " + evaluadorId);
    }
    if (!evaluador.getRoles().contains(Rol.EVALUADOR)) {
      throw new NegocioException("El usuario no tiene rol de evaluador");
    }
    if (asignacionEvaluacionDAO.buscarActiva(trabajoId, evaluadorId).isPresent()) {
      throw new NegocioException("El evaluador ya está asignado a este trabajo");
    }
    List<AsignacionEvaluacion> actuales = asignacionEvaluacionDAO.listarPorTrabajo(trabajoId);
    if (actuales.size() >= MAX_EVALUADORES) {
      throw new NegocioException("El trabajo ya tiene " + MAX_EVALUADORES + " evaluadores asignados");
    }

    AsignacionEvaluacion asignacion = new AsignacionEvaluacion();
    asignacion.setTrabajo(trabajo);
    asignacion.setEvaluador(evaluador);
    asignacion.setAceptada(false);
    trabajo.setEstado(EstadoTrabajo.EN_EVALUACION);
    trabajoDAO.modificar(trabajo);
    AsignacionEvaluacion creada = asignacionEvaluacionDAO.alta(asignacion);
    notificacionService.enviar(
        evaluador.getId(),
        "Nueva asignación de evaluación",
        "Te asignaron el trabajo \"" + trabajo.getTitulo() + "\". Aceptá o rechazá la convocatoria.");
    return creada;
  }

  public void desasignar(Long id) {
    AsignacionEvaluacion asignacion = asignacionEvaluacionDAO.recuperarPorId(id);
    if (asignacion == null) {
      throw new NegocioException("Asignación no encontrada: " + id);
    }
    asignacionEvaluacionDAO.baja(id);
  }

  public List<AsignacionEvaluacion> listarPorEvaluador(Long evaluadorId) {
    return asignacionEvaluacionDAO.listarPorEvaluador(evaluadorId);
  }

  public List<AsignacionEvaluacion> listarPorTrabajo(Long trabajoId) {
    return asignacionEvaluacionDAO.listarPorTrabajo(trabajoId);
  }

  public AsignacionEvaluacion responder(Long id, boolean aceptar) {
    AsignacionEvaluacion asignacion =
        asignacionEvaluacionDAO
            .recuperarPorIdConDetalle(id)
            .orElseThrow(() -> new NegocioException("Asignación no encontrada: " + id));
    if (!aceptar) {
      asignacion.setAceptada(false);
      asignacion.setFechaRespuesta(LocalDate.now());
      return asignacionEvaluacionDAO.modificar(asignacion);
    }
    asignacion.setAceptada(true);
    asignacion.setFechaRespuesta(LocalDate.now());
    return asignacionEvaluacionDAO.modificar(asignacion);
  }
}
