package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.ActividadDAO;
import ar.edu.unlp.jyaa.grupo1.dao.CronogramaPersonalDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import ar.edu.unlp.jyaa.grupo1.modelo.CronogramaPersonal;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;

@RequestScoped
public class CronogramaService {

  private final CronogramaPersonalDAO cronogramaPersonalDAO;
  private final ActividadDAO actividadDAO;
  private final UsuarioDAO usuarioDAO;

  @Inject
  public CronogramaService(
      CronogramaPersonalDAO cronogramaPersonalDAO,
      ActividadDAO actividadDAO,
      UsuarioDAO usuarioDAO) {
    this.cronogramaPersonalDAO = cronogramaPersonalDAO;
    this.actividadDAO = actividadDAO;
    this.usuarioDAO = usuarioDAO;
  }

  public CronogramaPersonal obtenerCronograma(Long usuarioId) {
    return cronogramaPersonalDAO
        .buscarPorUsuarioId(usuarioId)
        .orElseGet(
            () -> {
              Usuario usuario = usuarioDAO.recuperarPorId(usuarioId);
              if (usuario == null) {
                throw new NegocioException("Usuario no encontrado: " + usuarioId);
              }
              CronogramaPersonal cronograma = new CronogramaPersonal();
              cronograma.setUsuario(usuario);
              return cronogramaPersonalDAO.alta(cronograma);
            });
  }

  public CronogramaPersonal agregarActividad(Long usuarioId, Long actividadId) {
    CronogramaPersonal cronograma = obtenerCronograma(usuarioId);
    Actividad actividad = actividadDAO.recuperarPorId(actividadId);
    if (actividad == null) {
      throw new NegocioException("Actividad no encontrada: " + actividadId);
    }
    if (cronograma.getActividades().stream().anyMatch(a -> a.getId().equals(actividadId))) {
      throw new NegocioException("La actividad ya está en el cronograma");
    }
    for (Actividad existente : cronograma.getActividades()) {
      if (seSuperponen(existente, actividad)) {
        throw new NegocioException(
            "Conflicto de horario con la actividad: " + existente.getTitulo());
      }
    }
    cronograma.getActividades().add(actividad);
    return cronogramaPersonalDAO.modificar(cronograma);
  }

  public CronogramaPersonal quitarActividad(Long usuarioId, Long actividadId) {
    CronogramaPersonal cronograma = obtenerCronograma(usuarioId);
    boolean removida =
        cronograma.getActividades().removeIf(a -> a.getId().equals(actividadId));
    if (!removida) {
      throw new NegocioException("La actividad no está en el cronograma");
    }
    return cronogramaPersonalDAO.modificar(cronograma);
  }

  private boolean seSuperponen(Actividad a, Actividad b) {
    if (a.getInicio() == null
        || a.getFin() == null
        || b.getInicio() == null
        || b.getFin() == null) {
      return false;
    }
    return a.getInicio().isBefore(b.getFin()) && a.getFin().isAfter(b.getInicio());
  }
}
