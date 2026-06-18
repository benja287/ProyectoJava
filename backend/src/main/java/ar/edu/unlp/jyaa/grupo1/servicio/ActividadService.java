package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.ActividadDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import ar.edu.unlp.jyaa.grupo1.web.dto.ActividadResumenDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaActividadesDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.util.List;

@RequestScoped
public class ActividadService {

  private static final int PAGE_DEFAULT = 1;
  private static final int SIZE_DEFAULT = 20;
  private static final int SIZE_MAX = 100;

  @Inject private ActividadDAO actividadDAO;

  public PaginaActividadesDTO listar(int page, int size) {
    int safePage = Math.max(PAGE_DEFAULT, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;

    long total = actividadDAO.contar();
    List<ActividadResumenDTO> items =
        actividadDAO.listarPaginado(offset, safeSize).stream()
            .map(ActividadResumenDTO::from)
            .toList();
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);

    return new PaginaActividadesDTO(items, safePage, safeSize, total, totalPages);
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
