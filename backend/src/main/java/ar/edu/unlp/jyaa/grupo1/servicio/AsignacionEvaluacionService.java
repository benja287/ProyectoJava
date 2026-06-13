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

@RequestScoped
public class AsignacionEvaluacionService {

  private final AsignacionEvaluacionDAO asignacionEvaluacionDAO;
  private final TrabajoDAO trabajoDAO;
  private final UsuarioDAO usuarioDAO;

  @Inject
  public AsignacionEvaluacionService(
      AsignacionEvaluacionDAO asignacionEvaluacionDAO,
      TrabajoDAO trabajoDAO,
      UsuarioDAO usuarioDAO) {
    this.asignacionEvaluacionDAO = asignacionEvaluacionDAO;
    this.trabajoDAO = trabajoDAO;
    this.usuarioDAO = usuarioDAO;
  }

  public AsignacionEvaluacion asignar(Long trabajoId, Long evaluadorId) {
    Trabajo trabajo = trabajoDAO.recuperarPorId(trabajoId);
    if (trabajo == null) {
      throw new NegocioException("Trabajo no encontrado: " + trabajoId);
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

    AsignacionEvaluacion asignacion = new AsignacionEvaluacion();
    asignacion.setTrabajo(trabajo);
    asignacion.setEvaluador(evaluador);
    asignacion.setAceptada(false);
    trabajo.setEstado(EstadoTrabajo.EN_EVALUACION);
    trabajoDAO.modificar(trabajo);
    return asignacionEvaluacionDAO.alta(asignacion);
  }

  public void desasignar(Long id) {
    AsignacionEvaluacion asignacion = asignacionEvaluacionDAO.recuperarPorId(id);
    if (asignacion == null) {
      throw new NegocioException("Asignación no encontrada: " + id);
    }
    asignacionEvaluacionDAO.baja(id);
  }

  public AsignacionEvaluacion responder(Long id, boolean aceptar) {
    AsignacionEvaluacion asignacion = asignacionEvaluacionDAO.recuperarPorId(id);
    if (asignacion == null) {
      throw new NegocioException("Asignación no encontrada: " + id);
    }
    asignacion.setAceptada(aceptar);
    asignacion.setFechaRespuesta(LocalDate.now());
    return asignacionEvaluacionDAO.modificar(asignacion);
  }
}
