package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.ActividadDAO;
import ar.edu.unlp.jyaa.grupo1.dao.CronogramaPersonalDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import ar.edu.unlp.jyaa.grupo1.modelo.Aula;
import ar.edu.unlp.jyaa.grupo1.modelo.CronogramaPersonal;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoActividad;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;

@RequestScoped
public class CronogramaService {

  @Inject private CronogramaPersonalDAO cronogramaPersonalDAO;
  @Inject private ActividadDAO actividadDAO;
  @Inject private UsuarioDAO usuarioDAO;
  @Inject private CongresoService congresoService;

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
    validarProgramaPublicado();
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
    validarCapacidadAula(actividad);
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

  /**
   * Agregar a la agenda = intención de asistir. Si el aula tiene capacidad, no se puede superar
   * el cupo por cantidad de agendas que ya incluyen esa actividad.
   */
  private void validarCapacidadAula(Actividad actividad) {
    Aula aula = actividad.getAula();
    if (aula == null || aula.getCapacidad() == null) {
      return;
    }
    long ocupados = cronogramaPersonalDAO.contarAgendasConActividad(actividad.getId());
    if (ocupados >= aula.getCapacidad()) {
      throw new NegocioException(
          "No podés agendar "
              + etiquetaTipoParaMensaje(actividad.getTipoActividad())
              + ": el aula «"
              + aula.getNombre()
              + "» alcanzó su capacidad ("
              + aula.getCapacidad()
              + ").");
    }
  }

  private static String etiquetaTipoParaMensaje(TipoActividad tipo) {
    if (tipo == null) {
      return "esta actividad";
    }
    return switch (tipo) {
      case MESA_TEMATICA -> "esta mesa temática";
      case MESA_REDONDA -> "esta mesa redonda";
      case POSTER -> "esta sesión de pósters";
      case TALLER -> "este taller";
      case CONFERENCIA -> "esta conferencia";
    };
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

  private void validarProgramaPublicado() {
    if (!congresoService.isProgramaPublicado()) {
      throw new NegocioException("El programa del congreso aún no fue publicado");
    }
  }
}
