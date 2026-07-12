package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.ActividadDAO;
import ar.edu.unlp.jyaa.grupo1.dao.AulaDAO;
import ar.edu.unlp.jyaa.grupo1.dao.CongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.TrabajoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.ActividadFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import ar.edu.unlp.jyaa.grupo1.modelo.Aula;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadPresentacion;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoActividad;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.util.FechasCongreso;
import ar.edu.unlp.jyaa.grupo1.rest.dto.ActualizarActividadProgramaRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CrearConferenciaRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CrearMesaRedondaRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CrearMesaTematicaRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CrearSesionPostersRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CrearTallerOficialRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.web.dto.ActividadCronogramaDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.ActividadResumenDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaActividadesDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;

@RequestScoped
public class ActividadService {

  private static final int PAGE_DEFAULT = 1;
  private static final int SIZE_DEFAULT = 20;
  private static final int SIZE_MAX = 100;

  @Inject private ActividadDAO actividadDAO;
  @Inject private AulaDAO aulaDAO;
  @Inject private TrabajoDAO trabajoDAO;
  @Inject private CongresoDAO congresoDAO;
  @Inject private CongresoService congresoService;
  @Inject private NotificacionService notificacionService;

  public PaginaActividadesDTO listar(int page, int size, ActividadFiltro filtro, AuthenticatedUser auth) {
    if (!auth.canListActividades()) {
      throw new NegocioException("No tiene permiso para listar actividades");
    }
    return listarFiltrado(page, size, filtro != null ? filtro : new ActividadFiltro(null, null, null, null));
  }

  public PaginaActividadesDTO listarPublico(int page, int size, ActividadFiltro filtro) {
    if (!congresoService.isProgramaPublicado()) {
      int safePage = Math.max(PAGE_DEFAULT, page);
      int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
      return new PaginaActividadesDTO(List.of(), safePage, safeSize, 0, 0);
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
    asignarAulaOSala(actividad, request.aulaId(), request.sala());
    actividad.setInicio(request.inicio());
    actividad.setFin(request.fin());
    sincronizarDiaCongreso(actividad);
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
    asignarAulaOSala(actividad, request.aulaId(), request.ubicacion());
    actividad.setInicio(request.inicio());
    actividad.setFin(request.fin());
    sincronizarDiaCongreso(actividad);
    actividad.setTipoActividad(TipoActividad.POSTER);
    actividad.setTrabajos(new ArrayList<>(trabajos));
    validarConflictos(actividad, null);
    Actividad creada = actividadDAO.alta(actividad);
    marcarTrabajosProgramados(trabajos);
    return creada;
  }

  public Actividad crearMesaRedonda(CrearMesaRedondaRequest request) {
    if (request.titulo() == null || request.titulo().isBlank()) {
      throw new NegocioException("Debe indicar el título");
    }
    if (request.moderador() == null || request.moderador().isBlank()) {
      throw new NegocioException("Debe indicar el moderador");
    }
    LocalDateTime[] horario = parseHorarioCongreso(request.fecha(), request.horaInicio(), request.horaFin());

    Actividad actividad = new Actividad();
    actividad.setTitulo(request.titulo().trim());
    actividad.setEjeTematico(blankToNull(request.ejeTematico()));
    actividad.setModerador(request.moderador().trim());
    actividad.setPanelistas(blankToNull(request.panelistas()));
    actividad.setDescripcion(blankToNull(request.descripcion()));
    asignarAulaOSala(actividad, request.aulaId(), request.sala());
    actividad.setInicio(horario[0]);
    actividad.setFin(horario[1]);
    sincronizarDiaCongreso(actividad);
    actividad.setTipoActividad(TipoActividad.MESA_REDONDA);
    validarSolapamientoTipo(actividad, null);
    validarConflictos(actividad, null);
    return actividadDAO.alta(actividad);
  }

  public Actividad crearTallerOficial(CrearTallerOficialRequest request) {
    if (request.titulo() == null || request.titulo().isBlank()) {
      throw new NegocioException("Debe indicar el título del taller");
    }
    if (request.responsables() == null || request.responsables().isBlank()) {
      throw new NegocioException("Debe indicar el/los responsable(s)");
    }
    LocalDateTime[] horario = parseHorarioCongreso(request.fecha(), request.horaInicio(), request.horaFin());

    Actividad actividad = new Actividad();
    actividad.setTitulo(request.titulo().trim());
    asignarAulaOSala(actividad, request.aulaId(), request.sala());
    actividad.setResponsables(request.responsables().trim());
    actividad.setDescripcion(blankToNull(request.descripcion()));
    actividad.setInicio(horario[0]);
    actividad.setFin(horario[1]);
    sincronizarDiaCongreso(actividad);
    actividad.setTipoActividad(TipoActividad.TALLER);

    if (request.propuestaTallerId() != null) {
      Trabajo propuesta = trabajoDAO.recuperarPorId(request.propuestaTallerId());
      if (propuesta == null) {
        throw new NegocioException("Propuesta de taller no encontrada");
      }
      if (propuesta.getTipo() != TipoTrabajo.PROPUESTA_TALLER) {
        throw new NegocioException("El trabajo indicado no es una propuesta de taller");
      }
      if (propuesta.getEstado() != EstadoTrabajo.APROBADO) {
        throw new NegocioException("La propuesta de taller debe estar aprobada");
      }
      actividad.setPropuestaTaller(propuesta);
      if (actividad.getDescripcion() == null && propuesta.getResumen() != null) {
        actividad.setDescripcion(propuesta.getResumen());
      }
    }

    validarSolapamientoTipo(actividad, null);
    validarConflictos(actividad, null);
    return actividadDAO.alta(actividad);
  }

  public Actividad crearConferencia(CrearConferenciaRequest request) {
    if (request.titulo() == null || request.titulo().isBlank()) {
      throw new NegocioException("Debe indicar el título de la conferencia");
    }
    if (request.conferencistas() == null || request.conferencistas().isBlank()) {
      throw new NegocioException("Debe indicar el/los conferencista(s)");
    }
    LocalDateTime[] horario = parseHorarioCongreso(request.fecha(), request.horaInicio(), request.horaFin());

    Actividad actividad = new Actividad();
    actividad.setTitulo(request.titulo().trim());
    asignarAulaOSala(actividad, request.aulaId(), request.sala());
    actividad.setConferencistas(request.conferencistas().trim());
    actividad.setModerador(blankToNull(request.moderador()));
    actividad.setInstitucion(blankToNull(request.institucion()));
    actividad.setDescripcion(blankToNull(request.descripcion()));
    actividad.setInicio(horario[0]);
    actividad.setFin(horario[1]);
    sincronizarDiaCongreso(actividad);
    actividad.setTipoActividad(TipoActividad.CONFERENCIA);
    validarSolapamientoTipo(actividad, null);
    validarConflictos(actividad, null);
    return actividadDAO.alta(actividad);
  }

  public List<ActividadCronogramaDTO> listarCronogramaAdmin() {
    return actividadDAO.listarCronogramaCompleto().stream().map(ActividadCronogramaDTO::from).toList();
  }

  public Actividad actualizarPrograma(Long id, ActualizarActividadProgramaRequest request) {
    Actividad actividad = actividadDAO.recuperarPorId(id);
    if (actividad == null) {
      return null;
    }
    if (request.titulo() != null && !request.titulo().isBlank()) {
      actividad.setTitulo(request.titulo().trim());
    }
    if (request.aulaId() != null || (request.sala() != null && !request.sala().isBlank())) {
      asignarAulaOSala(actividad, request.aulaId(), request.sala());
    }
    if (request.inicio() != null) {
      actividad.setInicio(request.inicio());
    }
    if (request.fin() != null) {
      actividad.setFin(request.fin());
    }
    sincronizarDiaCongreso(actividad);
    if (request.codigo() != null) {
      actividad.setCodigo(blankToNull(request.codigo()));
    }
    if (request.descripcion() != null) {
      actividad.setDescripcion(blankToNull(request.descripcion()));
    }
    if (request.ejeTematico() != null) {
      actividad.setEjeTematico(blankToNull(request.ejeTematico()));
    }
    if (request.moderador() != null) {
      actividad.setModerador(blankToNull(request.moderador()));
    }
    if (request.panelistas() != null) {
      actividad.setPanelistas(blankToNull(request.panelistas()));
    }
    if (request.responsables() != null) {
      actividad.setResponsables(blankToNull(request.responsables()));
    }
    if (request.conferencistas() != null) {
      actividad.setConferencistas(blankToNull(request.conferencistas()));
    }
    if (request.institucion() != null) {
      actividad.setInstitucion(blankToNull(request.institucion()));
    }
    validarSolapamientoTipo(actividad, id);
    validarConflictos(actividad, id);
    return actividadDAO.modificar(actividad);
  }

  public Actividad modificar(Long id, Actividad actividad) {
    if (actividadDAO.recuperarPorId(id) == null) {
      return null;
    }
    actividad.setId(id);
    validarConflictos(actividad, id);
    return actividadDAO.modificar(actividad);
  }

  public void quitarTrabajo(Long actividadId, Long trabajoId) {
    Actividad actividad = actividadDAO.recuperarPorId(actividadId);
    if (actividad == null) {
      throw new NegocioException("Actividad no encontrada");
    }
    if (actividad.getTipoActividad() != TipoActividad.MESA_TEMATICA
        && actividad.getTipoActividad() != TipoActividad.POSTER) {
      throw new NegocioException("Solo mesas temáticas y sesiones de pósters admiten quitar trabajos");
    }
    Trabajo trabajo = trabajoDAO.recuperarPorId(trabajoId);
    if (trabajo == null) {
      throw new NegocioException("Trabajo no encontrado");
    }
    boolean removido =
        actividad.getTrabajos().removeIf(t -> trabajoId.equals(t.getId()));
    if (!removido) {
      throw new NegocioException("El trabajo no está asignado a esta actividad");
    }
    trabajo.setEstado(EstadoTrabajo.APROBADO);
    actividadDAO.modificar(actividad);
    trabajoDAO.modificar(trabajo);
  }

  public void baja(Long id) {
    Actividad actividad = actividadDAO.recuperarPorId(id);
    if (actividad == null) {
      throw new NegocioException("Actividad no encontrada");
    }
    if (actividad.getTipoActividad() == TipoActividad.MESA_TEMATICA
        || actividad.getTipoActividad() == TipoActividad.POSTER) {
      for (Trabajo t : new ArrayList<>(actividad.getTrabajos())) {
        t.setEstado(EstadoTrabajo.APROBADO);
        trabajoDAO.modificar(t);
      }
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
      if (t.getAutor() != null) {
        notificacionService.enviar(
            t.getAutor().getId(),
            "Trabajo programado",
            "Tu trabajo \"" + t.getTitulo() + "\" fue incluido en el cronograma del congreso.");
      }
    }
  }

  private void validarRequestMesa(CrearMesaTematicaRequest request) {
    if (request.codigo() == null || request.codigo().isBlank()) {
      throw new NegocioException("Debe indicar el código de la mesa");
    }
    if (request.titulo() == null || request.titulo().isBlank()) {
      throw new NegocioException("Debe indicar la descripción de la sesión");
    }
    if (request.aulaId() == null && (request.sala() == null || request.sala().isBlank())) {
      throw new NegocioException("Debe indicar el aula o la sala");
    }
    validarHorario(request.inicio(), request.fin());
  }

  private void validarRequestPosters(CrearSesionPostersRequest request) {
    if (request.titulo() == null || request.titulo().isBlank()) {
      throw new NegocioException("Debe indicar el nombre de la sesión");
    }
    if (request.aulaId() == null
        && (request.ubicacion() == null || request.ubicacion().isBlank())) {
      throw new NegocioException("Debe indicar el aula o la ubicación");
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

  private void asignarAulaOSala(Actividad actividad, Long aulaId, String salaTexto) {
    if (aulaId != null) {
      Aula aula = aulaDAO.recuperarPorId(aulaId);
      if (aula == null) {
        throw new NegocioException("Aula no encontrada");
      }
      if (!aula.isActiva()) {
        throw new NegocioException("El aula seleccionada está desactivada");
      }
      actividad.setAula(aula);
      actividad.setSala(aula.getNombre());
      return;
    }
    if (salaTexto != null && !salaTexto.isBlank()) {
      actividad.setAula(null);
      actividad.setSala(salaTexto.trim());
      return;
    }
    throw new NegocioException("Debe indicar el aula/sala de la actividad");
  }

  private void sincronizarDiaCongreso(Actividad actividad) {
    if (actividad.getInicio() == null) {
      return;
    }
    var congreso = congresoDAO.obtenerPrincipal();
    LocalDate desde = congreso != null ? congreso.getCongresoDesde() : null;
    Integer dia = FechasCongreso.numeroDia(actividad.getInicio().toLocalDate(), desde);
    if (dia == null && desde != null) {
      throw new NegocioException(
          "La fecha de la actividad debe caer en los "
              + FechasCongreso.DIAS_CONGRESO
              + " días del congreso");
    }
    actividad.setDiaCongreso(dia);
  }

  private void validarConflictos(Actividad actividad, Long excluirId) {
    if ((actividad.getSala() == null || actividad.getSala().isBlank())
        && actividad.getAula() == null) {
      throw new NegocioException("Debe indicar el aula/sala de la actividad");
    }
    if (actividad.getInicio() == null || actividad.getFin() == null) {
      throw new NegocioException("Debe indicar fecha y horario de inicio y fin");
    }
    if (!actividad.getFin().isAfter(actividad.getInicio())) {
      throw new NegocioException("El horario de fin debe ser posterior al de inicio");
    }
    List<Actividad> conflictos;
    if (actividad.getAula() != null && actividad.getAula().getId() != null) {
      conflictos =
          actividadDAO.buscarConflictosPorAula(
              actividad.getAula().getId(),
              actividad.getInicio(),
              actividad.getFin(),
              excluirId);
      if (!conflictos.isEmpty()) {
        throw new NegocioException(
            "Conflicto de horario en el aula " + actividad.getAula().getNombre());
      }
    } else {
      conflictos =
          actividadDAO.buscarConflictos(
              actividad.getSala(), actividad.getInicio(), actividad.getFin(), excluirId);
      if (!conflictos.isEmpty()) {
        throw new NegocioException("Conflicto de horario en la sala " + actividad.getSala());
      }
    }
  }

  private void validarSolapamientoTipo(Actividad actividad, Long excluirId) {
    List<Actividad> solapamientos =
        actividadDAO.buscarSolapamientoTipo(
            actividad.getTipoActividad(), actividad.getInicio(), actividad.getFin(), excluirId);
    if (!solapamientos.isEmpty()) {
      throw new NegocioException(
          "Ya existe una actividad de este tipo en ese horario. Elegí otro horario.");
    }
  }

  private LocalDateTime[] parseHorarioCongreso(String fecha, String horaInicio, String horaFin) {
    if (fecha == null || fecha.isBlank() || horaInicio == null || horaInicio.isBlank() || horaFin == null || horaFin.isBlank()) {
      throw new NegocioException("Debe indicar fecha y horario de inicio y fin");
    }
    LocalDate dia;
    try {
      dia = LocalDate.parse(fecha.trim());
    } catch (DateTimeParseException e) {
      throw new NegocioException("Fecha inválida (use AAAA-MM-DD)");
    }
    var congreso = congresoDAO.obtenerPrincipal();
    if (!FechasCongreso.esFechaValida(dia, congreso.getCongresoDesde(), congreso.getCongresoHasta())) {
      throw new NegocioException(
          "La fecha seleccionada no es válida para este congreso (debe caer en los 3 días del evento)");
    }
    LocalTime ini;
    LocalTime fin;
    try {
      ini = LocalTime.parse(horaInicio.trim());
      fin = LocalTime.parse(horaFin.trim());
    } catch (DateTimeParseException e) {
      throw new NegocioException("Horario inválido (use HH:mm)");
    }
    LocalDateTime inicio = LocalDateTime.of(dia, ini);
    LocalDateTime finDt = LocalDateTime.of(dia, fin);
    if (!finDt.isAfter(inicio)) {
      throw new NegocioException("La hora de fin debe ser posterior a la hora de inicio");
    }
    return new LocalDateTime[] {inicio, finDt};
  }

  private static String blankToNull(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }
}
