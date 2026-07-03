package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.ActividadDAO;
import ar.edu.unlp.jyaa.grupo1.dao.TrabajoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.ActividadFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadPresentacion;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoActividad;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CrearMesaTematicaRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CrearSesionPostersRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.web.dto.ActividadResumenDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaActividadesDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RequestScoped
public class ActividadService {

  private static final int PAGE_DEFAULT = 1;
  private static final int SIZE_DEFAULT = 20;
  private static final int SIZE_MAX = 100;

  @Inject private ActividadDAO actividadDAO;
  @Inject private TrabajoDAO trabajoDAO;

  public PaginaActividadesDTO listar(int page, int size, ActividadFiltro filtro, AuthenticatedUser auth) {
    if (!auth.canListActividades()) {
      throw new NegocioException("No tiene permiso para listar actividades");
    }
    return listarFiltrado(page, size, filtro != null ? filtro : new ActividadFiltro(null, null, null, null));
  }

  public PaginaActividadesDTO listar(int page, int size) {
    return listarFiltrado(page, size, new ActividadFiltro(null, null, null, null));
  }

  public static ActividadFiltro parseFiltro(
      String codigo, String tipoActividad, String titulo, String sala) {
    TipoActividad tipoEnum = null;
    if (tipoActividad != null && !tipoActividad.isBlank()) {
      try {
        tipoEnum = TipoActividad.valueOf(tipoActividad.trim().toUpperCase());
      } catch (IllegalArgumentException e) {
        throw new NegocioException("Tipo de actividad inválido: " + tipoActividad);
      }
    }
    return new ActividadFiltro(codigo, tipoEnum, titulo, sala);
  }

  private PaginaActividadesDTO listarFiltrado(int page, int size, ActividadFiltro filtro) {
    int safePage = Math.max(PAGE_DEFAULT, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;

    long total = actividadDAO.contarFiltrado(filtro);
    List<ActividadResumenDTO> items =
        actividadDAO.listarFiltrado(filtro, offset, safeSize).stream()
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

  public Actividad crearMesaTematica(CrearMesaTematicaRequest request) {
    validarRequestMesa(request);
    List<Trabajo> trabajos = cargarTrabajosParaProgramacion(request.trabajoIds(), ModalidadPresentacion.ORAL);
    validarMismoEje(trabajos);

    Actividad actividad = new Actividad();
    actividad.setCodigo(request.codigo().trim());
    actividad.setTitulo(request.titulo().trim());
    actividad.setSala(request.sala().trim());
    actividad.setInicio(request.inicio());
    actividad.setFin(request.fin());
    actividad.setTipoActividad(TipoActividad.MESA_TEMATICA);
    actividad.setTrabajos(new ArrayList<>(trabajos));
    validarConflictos(actividad, null);
    Actividad creada = actividadDAO.alta(actividad);
    marcarTrabajosProgramados(trabajos);
    return creada;
  }

  public Actividad crearSesionPosters(CrearSesionPostersRequest request) {
    validarRequestPosters(request);
    List<Trabajo> trabajos =
        cargarTrabajosParaProgramacion(request.trabajoIds(), ModalidadPresentacion.POSTER);
    validarMismoEje(trabajos);

    Actividad actividad = new Actividad();
    actividad.setTitulo(request.titulo().trim());
    actividad.setSala(request.ubicacion().trim());
    actividad.setInicio(request.inicio());
    actividad.setFin(request.fin());
    actividad.setTipoActividad(TipoActividad.POSTER);
    actividad.setTrabajos(new ArrayList<>(trabajos));
    validarConflictos(actividad, null);
    Actividad creada = actividadDAO.alta(actividad);
    marcarTrabajosProgramados(trabajos);
    return creada;
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

  private List<Trabajo> cargarTrabajosParaProgramacion(
      List<Long> trabajoIds, ModalidadPresentacion modalidadEsperada) {
    if (trabajoIds == null || trabajoIds.isEmpty()) {
      throw new NegocioException("Debe seleccionar al menos un trabajo aprobado");
    }
    List<Trabajo> trabajos = new ArrayList<>();
    for (Long id : trabajoIds) {
      Trabajo t = trabajoDAO.recuperarPorId(id);
      if (t == null) {
        throw new NegocioException("Trabajo no encontrado: " + id);
      }
      if (t.getEstado() != EstadoTrabajo.APROBADO) {
        throw new NegocioException("El trabajo #" + id + " no está aprobado");
      }
      if (t.getModalidad() != modalidadEsperada) {
        throw new NegocioException(
            "El trabajo #" + id + " no corresponde a modalidad " + modalidadEsperada);
      }
      trabajos.add(t);
    }
    return trabajos;
  }

  private void validarMismoEje(List<Trabajo> trabajos) {
    Set<String> ejes = new HashSet<>();
    for (Trabajo t : trabajos) {
      if (t.getEjeTematico() != null) {
        ejes.add(t.getEjeTematico().trim());
      }
    }
    if (ejes.size() > 1) {
      throw new NegocioException("No se pueden mezclar trabajos de distintos ejes temáticos");
    }
  }

  private void marcarTrabajosProgramados(List<Trabajo> trabajos) {
    for (Trabajo t : trabajos) {
      t.setEstado(EstadoTrabajo.PROGRAMADO);
      trabajoDAO.modificar(t);
    }
  }

  private void validarRequestMesa(CrearMesaTematicaRequest request) {
    if (request.codigo() == null || request.codigo().isBlank()) {
      throw new NegocioException("Debe indicar el código de la mesa");
    }
    if (request.titulo() == null || request.titulo().isBlank()) {
      throw new NegocioException("Debe indicar la descripción de la sesión");
    }
    if (request.sala() == null || request.sala().isBlank()) {
      throw new NegocioException("Debe indicar la sala");
    }
    validarHorario(request.inicio(), request.fin());
  }

  private void validarRequestPosters(CrearSesionPostersRequest request) {
    if (request.titulo() == null || request.titulo().isBlank()) {
      throw new NegocioException("Debe indicar el nombre de la sesión");
    }
    if (request.ubicacion() == null || request.ubicacion().isBlank()) {
      throw new NegocioException("Debe indicar la ubicación");
    }
    validarHorario(request.inicio(), request.fin());
  }

  private void validarHorario(java.time.LocalDateTime inicio, java.time.LocalDateTime fin) {
    if (inicio == null || fin == null) {
      throw new NegocioException("Debe indicar fecha y horario de inicio y fin");
    }
    if (!fin.isAfter(inicio)) {
      throw new NegocioException("El horario de fin debe ser posterior al de inicio");
    }
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
