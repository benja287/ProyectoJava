package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.ActividadDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.util.List;

@RequestScoped
public class ActividadService {

  private final ActividadDAO actividadDAO;

  @Inject
  public ActividadService(ActividadDAO actividadDAO) {
    this.actividadDAO = actividadDAO;
  }

  public List<Actividad> listar() {
    return actividadDAO.listarTodos();
  }

  public Actividad buscar(Long id) {
    return actividadDAO.recuperarPorId(id);
  }

  public Actividad alta(Actividad actividad) {
    validarConflictos(actividad, null);
    return actividadDAO.alta(actividad);
  }

  public Actividad modificar(Long id, Actividad actividad) {
    if (actividadDAO.recuperarPorId(id) == null) {
      return null;
    }
    actividad.setId(id);
    validarConflictos(actividad, id);
    return actividadDAO.modificar(actividad);
  }

  public void baja(Long id) {
    if (actividadDAO.recuperarPorId(id) == null) {
      throw new NegocioException("Actividad no encontrada");
    }
    actividadDAO.baja(id);
  }

  private void validarConflictos(Actividad actividad, Long excluirId) {
    if (actividad.getSala() == null || actividad.getSala().isBlank()) {
      throw new NegocioException("Debe indicar el aula/sala de la actividad");
    }
    if (actividad.getInicio() == null || actividad.getFin() == null) {
      throw new NegocioException("Debe indicar fecha y horario de inicio y fin");
    }
    if (!actividad.getFin().isAfter(actividad.getInicio())) {
      throw new NegocioException("El horario de fin debe ser posterior al de inicio");
    }
    List<Actividad> conflictos =
        actividadDAO.buscarConflictos(
            actividad.getSala(), actividad.getInicio(), actividad.getFin(), excluirId);
    if (!conflictos.isEmpty()) {
      throw new NegocioException("Conflicto de horario en la sala " + actividad.getSala());
    }
  }
}
