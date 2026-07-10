package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.AsignacionEvaluacionDAO;
import ar.edu.unlp.jyaa.grupo1.dao.ActividadDAO;
import ar.edu.unlp.jyaa.grupo1.dao.CongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.TrabajoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.TrabajoFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.EjesTematicos;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadPresentacion;
import ar.edu.unlp.jyaa.grupo1.modelo.RecomendacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoActividad;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.rest.dto.TrabajoUpdateRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.web.dto.PresentacionAutorDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaTrabajosDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.TrabajoEnvioResumenDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.TrabajoResumenDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.SolicitudAutorDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RequestScoped
public class TrabajoService {

  private static final int MAX_PRECHECK_INTENTOS = 3;
  private static final int MAX_REVISION_INTENTOS = 2;

  @Inject private TrabajoDAO trabajoDAO;
  @Inject private ActividadDAO actividadDAO;
  @Inject private UsuarioDAO usuarioDAO;
  @Inject private AsignacionEvaluacionDAO asignacionEvaluacionDAO;
  @Inject private CongresoDAO congresoDAO;
  @Inject private DocumentStorageService documentStorageService;
  @Inject private NotificacionService notificacionService;

  private static final int PAGE_DEFAULT = 1;
  private static final int SIZE_DEFAULT = 20;
  private static final int SIZE_MAX = 100;

  public PaginaTrabajosDTO listar(int page, int size, TrabajoFiltro filtro, AuthenticatedUser auth) {
    TrabajoFiltro effective = aplicarAlcance(filtro, auth);
    return listarFiltrado(page, size, effective);
  }

  public PaginaTrabajosDTO listar(int page, int size) {
    return listarFiltrado(page, size, new TrabajoFiltro(null, null, null, null, null, null, null));
  }

  public PaginaTrabajosDTO listarPorAutor(Long autorId, int page, int size) {
    if (usuarioDAO.recuperarPorId(autorId) == null) {
      throw new NegocioException("Autor no encontrado: " + autorId);
    }
    return listarFiltrado(page, size, new TrabajoFiltro(null, null, null, null, null, null, autorId));
  }

  public List<TrabajoResumenDTO> listarParaComite() {
    TrabajoFiltro filtro = new TrabajoFiltro(null, null, null, null, null, null, null);
    return trabajoDAO.listarFiltrado(filtro, 0, 500).stream()
        .filter(t -> t.getTipo() != TipoTrabajo.PROPUESTA_TALLER)
        .filter(t -> t.getEstado() != EstadoTrabajo.RECHAZADO)
        .filter(t -> t.getEstado() != EstadoTrabajo.BORRADOR)
        .map(this::toResumenConAsignaciones)
        .toList();
  }

  /**
   * Asistentes con al menos un trabajo confirmado por el comité (APROBADO) pendientes de
   * habilitación explícita del rol AUTOR por el administrador.
   */
  public List<SolicitudAutorDTO> listarSolicitudesAutor() {
    List<Trabajo> trabajos =
        trabajoDAO
            .listarFiltrado(new TrabajoFiltro(null, null, null, null, null, null, null), 0, 500)
            .stream()
            .filter(t -> t.getTipo() != TipoTrabajo.PROPUESTA_TALLER)
            .filter(t -> t.getEstado() == EstadoTrabajo.APROBADO)
            .toList();

    Map<Long, List<Trabajo>> porAutor = new LinkedHashMap<>();
    for (Trabajo t : trabajos) {
      if (t.getAutor() == null || t.getAutor().getId() == null) {
        continue;
      }
      porAutor.computeIfAbsent(t.getAutor().getId(), k -> new ArrayList<>()).add(t);
    }

    List<SolicitudAutorDTO> solicitudes = new ArrayList<>();
    for (Map.Entry<Long, List<Trabajo>> entry : porAutor.entrySet()) {
      Usuario autor = usuarioDAO.recuperarPorId(entry.getKey());
      if (autor == null) {
        continue;
      }
      if (!pendienteHabilitacionAutor(autor)) {
        continue;
      }
      List<TrabajoResumenDTO> resumenes =
          entry.getValue().stream().map(this::toResumenConAsignaciones).toList();
      solicitudes.add(SolicitudAutorDTO.of(autor, resumenes));
    }
    return solicitudes;
  }

  /** Trabajos en estado APROBADO listos para mesas temáticas o sesiones de pósters. */
  public List<TrabajoResumenDTO> listarAprobadosParaProgramacion(String modalidadRaw) {
    ModalidadPresentacion modalidad;
    if (modalidadRaw == null || modalidadRaw.isBlank()) {
      throw new NegocioException("Debe indicar la modalidad (ORAL o POSTER)");
    }
    try {
      modalidad = ModalidadPresentacion.valueOf(modalidadRaw.trim().toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new NegocioException("Modalidad inválida: " + modalidadRaw);
    }
    TrabajoFiltro filtro =
        new TrabajoFiltro(null, null, null, EstadoTrabajo.APROBADO, modalidad, null, null);
    return trabajoDAO.listarFiltrado(filtro, 0, 500).stream()
        .filter(t -> t.getTipo() != TipoTrabajo.PROPUESTA_TALLER)
        .map(this::toResumenConAsignaciones)
        .toList();
  }

  /** Mesas temáticas y sesiones de pósters donde el autor tiene trabajos programados. */
  public List<PresentacionAutorDTO> listarPresentacionesAutor(Long autorId) {
    if (usuarioDAO.recuperarPorId(autorId) == null) {
      throw new NegocioException("Autor no encontrado: " + autorId);
    }
    List<PresentacionAutorDTO> result = new ArrayList<>();
    for (Actividad actividad : actividadDAO.listarCronogramaCompleto()) {
      TipoActividad tipo = actividad.getTipoActividad();
      if (tipo != TipoActividad.MESA_TEMATICA && tipo != TipoActividad.POSTER) {
        continue;
      }
      List<Trabajo> trabajos = actividad.getTrabajos();
      if (trabajos == null) {
        continue;
      }
      for (int i = 0; i < trabajos.size(); i++) {
        Trabajo t = trabajos.get(i);
        if (t.getAutor() == null || !autorId.equals(t.getAutor().getId())) {
          continue;
        }
        Integer panel = tipo == TipoActividad.POSTER ? i + 1 : null;
        result.add(
            new PresentacionAutorDTO(
                t.getId(),
                t.getTitulo(),
                t.getEjeTematico(),
                t.getModalidad(),
                actividad.getId(),
                actividad.getTitulo(),
                actividad.getCodigo(),
                tipo,
                actividad.getSala(),
                actividad.getInicio(),
                actividad.getFin(),
                panel));
      }
    }
    result.sort(
        Comparator.comparing(PresentacionAutorDTO::inicio, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(PresentacionAutorDTO::trabajoTitulo, Comparator.nullsLast(String::compareToIgnoreCase)));
    return result;
  }

  public static TrabajoFiltro parseFiltro(
      String titulo,
      String resumen,
      String ejeTematico,
      String estado,
      String modalidad,
      String tipo,
      Long autorId) {
    EstadoTrabajo estadoEnum = null;
    if (estado != null && !estado.isBlank()) {
      try {
        estadoEnum = EstadoTrabajo.valueOf(estado.trim().toUpperCase());
      } catch (IllegalArgumentException e) {
        throw new NegocioException("Estado de trabajo inválido: " + estado);
      }
    }
    ModalidadPresentacion modalidadEnum = null;
    if (modalidad != null && !modalidad.isBlank()) {
      try {
        modalidadEnum = ModalidadPresentacion.valueOf(modalidad.trim().toUpperCase());
      } catch (IllegalArgumentException e) {
        throw new NegocioException("Modalidad inválida: " + modalidad);
      }
    }
    TipoTrabajo tipoEnum = null;
    if (tipo != null && !tipo.isBlank()) {
      try {
        tipoEnum = TipoTrabajo.valueOf(tipo.trim().toUpperCase());
      } catch (IllegalArgumentException e) {
        throw new NegocioException("Tipo de trabajo inválido: " + tipo);
      }
    }
    return new TrabajoFiltro(
        titulo, resumen, ejeTematico, estadoEnum, modalidadEnum, tipoEnum, autorId);
  }

  private TrabajoFiltro aplicarAlcance(TrabajoFiltro filtro, AuthenticatedUser auth) {
    TrabajoFiltro base =
        filtro != null ? filtro : new TrabajoFiltro(null, null, null, null, null, null, null);
    if (auth.canListAllTrabajos()) {
      return base;
    }
    return new TrabajoFiltro(
        base.titulo(),
        base.resumen(),
        base.ejeTematico(),
        base.estado(),
        base.modalidad(),
        base.tipo(),
        auth.userId());
  }

  private PaginaTrabajosDTO listarFiltrado(int page, int size, TrabajoFiltro filtro) {
    int safePage = Math.max(PAGE_DEFAULT, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;

    long total = trabajoDAO.contarFiltrado(filtro);
    List<TrabajoResumenDTO> items =
        trabajoDAO.listarFiltrado(filtro, offset, safeSize).stream()
            .map(this::toResumenConAsignaciones)
            .toList();
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);

    return new PaginaTrabajosDTO(items, safePage, safeSize, total, totalPages);
  }

  private TrabajoResumenDTO toResumenConAsignaciones(Trabajo t) {
    if (t.getId() == null) {
      return TrabajoResumenDTO.from(t);
    }
    return TrabajoResumenDTO.from(t, asignacionEvaluacionDAO.listarPorTrabajo(t.getId()));
  }

  public Trabajo buscar(Long id) {
    return trabajoDAO
        .recuperarPorIdConAutor(id)
        .orElseThrow(() -> new NegocioException("Trabajo no encontrado: " + id));
  }

  public TrabajoResumenDTO buscarResumen(Long id) {
    return toResumenConAsignaciones(buscar(id));
  }

  public Trabajo crear(Long autorId, Trabajo trabajo) {
    Usuario autor = usuarioDAO.recuperarPorId(autorId);
    if (autor == null) {
      throw new NegocioException("Autor no encontrado: " + autorId);
    }
    validarDatosPostulacion(trabajo);
    if (trabajo.getTipo() == TipoTrabajo.PROPUESTA_TALLER) {
      validarPropuestaTallerUnica(autorId);
    }
    trabajo.setAutor(autor);
    trabajo.setEstado(EstadoTrabajo.BORRADOR);
    trabajo.setFechaCreacion(LocalDate.now());
    if (trabajo.getPrecheckIntentos() < 0) {
      trabajo.setPrecheckIntentos(0);
    }
    return trabajoDAO.alta(trabajo);
  }

  public Trabajo modificar(Long id, TrabajoUpdateRequest request) {
    Trabajo trabajo = buscar(id);
    if (!puedeEditar(trabajo)) {
      throw new NegocioException(
          "Solo se pueden editar borradores, trabajos observados en precheck o con correcciones pendientes");
    }
    if (request.titulo() != null && !request.titulo().isBlank()) {
      trabajo.setTitulo(request.titulo().trim());
    }
    if (request.resumen() != null) {
      trabajo.setResumen(request.resumen());
    }
    if (request.ejeTematico() != null) {
      trabajo.setEjeTematico(request.ejeTematico());
    }
    if (request.modalidad() != null && !request.modalidad().isBlank()) {
      try {
        trabajo.setModalidad(ModalidadPresentacion.valueOf(request.modalidad().trim().toUpperCase()));
      } catch (IllegalArgumentException e) {
        throw new NegocioException("Modalidad inválida");
      }
    }
    if (request.tipo() != null && !request.tipo().isBlank()) {
      try {
        trabajo.setTipo(TipoTrabajo.valueOf(request.tipo().trim().toUpperCase()));
      } catch (IllegalArgumentException e) {
        throw new NegocioException("Tipo de trabajo inválido");
      }
    }
    if (request.coautores() != null) {
      trabajo.setCoautores(new ArrayList<>(request.coautores()));
    }
    validarDatosPostulacion(trabajo);
    return trabajoDAO.modificar(trabajo);
  }

  public Trabajo enviar(Long id, String rolEnvioRaw) {
    Trabajo trabajo = buscar(id);
    boolean reenvioPrecheck =
        trabajo.getEstado() == EstadoTrabajo.PRECHECK_OBSERVADO
            && trabajo.getPrecheckIntentos() > 0
            && trabajo.getPrecheckIntentos() < MAX_PRECHECK_INTENTOS;
    boolean reenvioRevision = trabajo.getEstado() == EstadoTrabajo.OBSERVADO_EVALUACION;
    boolean primerEnvio = trabajo.getEstado() == EstadoTrabajo.BORRADOR;

    if (!primerEnvio && !reenvioPrecheck && !reenvioRevision) {
      throw new NegocioException(
          "Solo se pueden enviar borradores, reenviar correcciones o reenviar tras observación de precheck");
    }

    Usuario autor = trabajo.getAutor();
    Rol rolEnvio = resolverRolEnvio(rolEnvioRaw, autor);
    if (primerEnvio) {
      validarLimiteNuevoEnvio(autor, rolEnvio);
    }

    validarDatosPostulacion(trabajo);
    if (trabajo.getDocumentoUrl() == null || trabajo.getDocumentoUrl().isBlank()) {
      throw new NegocioException("Debe adjuntar el PDF antes de enviar el trabajo");
    }

    if (reenvioRevision) {
      limpiarAsignaciones(trabajo.getId());
    }

    if (primerEnvio || trabajo.getRolEnvio() == null) {
      trabajo.setRolEnvio(rolEnvio);
    }
    trabajo.setEstado(EstadoTrabajo.ENVIADO);
    Trabajo guardado = trabajoDAO.modificar(trabajo);
    notificarAutor(
        guardado,
        reenvioPrecheck || reenvioRevision ? "Trabajo reenviado" : "Trabajo enviado",
        reenvioPrecheck || reenvioRevision
            ? "Tu trabajo \"" + guardado.getTitulo() + "\" fue reenviado y está pendiente de prevalidación."
            : "Tu trabajo \"" + guardado.getTitulo() + "\" fue enviado y está pendiente de revisión del comité.");
    Map<String, String> varsComite = variablesBaseTrabajo(guardado);
    if (guardado.getAutor() != null) {
      varsComite.put(
          "nombre_autor",
          guardado.getAutor().getNombre() + " " + guardado.getAutor().getApellido());
    }
    String plantillaComite =
        reenvioPrecheck || reenvioRevision ? "REENVIO_ORGANIZADOR" : "ENVIO_TRABAJO_ORGANIZADOR";
    notificacionService.enviarPorRolConPlantilla(
        Rol.ORGANIZADOR_CIENTIFICO, plantillaComite, varsComite, null);
    return guardado;
  }

  public TrabajoEnvioResumenDTO obtenerResumenEnvio(Long autorId, String rolEnvioRaw) {
    Usuario autor = usuarioDAO.recuperarPorId(autorId);
    if (autor == null) {
      throw new NegocioException("Autor no encontrado: " + autorId);
    }
    Rol rolEnvio = resolverRolEnvio(rolEnvioRaw, autor);
    boolean tieneAutor = autor.getRoles().contains(Rol.AUTOR);
    boolean tieneAsistente = autor.getRoles().contains(Rol.ASISTENTE);
    boolean bloqueadoPorDobleRol =
        rolEnvio == Rol.ASISTENTE && tieneAutor && tieneAsistente;

    List<Trabajo> todos =
        trabajoDAO.listarFiltrado(
            new TrabajoFiltro(null, null, null, null, null, null, autorId), 0, 200);
    List<Trabajo> cientificos =
        todos.stream().filter(t -> t.getTipo() != TipoTrabajo.PROPUESTA_TALLER).toList();

    List<Trabajo> delRol = filtrarPorRolEnvio(cientificos, rolEnvio, tieneAutor, tieneAsistente);
    int totalHistorico = delRol.size();
    int trabajosActivos = (int) delRol.stream().filter(this::esTrabajoActivoParaCupo).count();
    int reenviosDisponibles = (int) delRol.stream().filter(this::puedeReenviar).count();

    int limiteActivos = limiteActivos(autor, rolEnvio);
    LocalDate deadline = congresoDAO.obtenerPrincipal().getEnvioTrabajosHasta();
    boolean fechaLimitePasada = deadline != null && LocalDate.now().isAfter(deadline);

    boolean puedeEnviarNuevo = false;
    String mensajeBloqueo = null;
    if (bloqueadoPorDobleRol) {
      mensajeBloqueo =
          "Tu cuenta tiene rol autor y asistente. Cambiá a rol autor y enviá desde el panel Autor.";
    } else if (reenviosDisponibles > 0) {
      puedeEnviarNuevo = true;
    } else if (fechaLimitePasada) {
      mensajeBloqueo =
          "No se permiten envíos nuevos: se superó la fecha límite"
              + (deadline != null ? " (" + deadline + ")." : ".");
    } else if (trabajosActivos >= limiteActivos) {
      mensajeBloqueo =
          "Ya alcanzaste el máximo de "
              + limiteActivos
              + " trabajo"
              + (limiteActivos > 1 ? "s" : "")
              + " activo"
              + (limiteActivos > 1 ? "s" : "")
              + ".";
    } else {
      puedeEnviarNuevo = true;
    }

    return new TrabajoEnvioResumenDTO(
        delRol.size(),
        cientificos.size(),
        trabajosActivos,
        reenviosDisponibles,
        limiteActivos,
        puedeEnviarNuevo,
        bloqueadoPorDobleRol,
        mensajeBloqueo,
        deadline,
        fechaLimitePasada);
  }

  public Trabajo registrarPrecheck(Long id, boolean apto, String observaciones) {
    Trabajo trabajo = buscar(id);
    if (trabajo.getEstado() != EstadoTrabajo.ENVIADO) {
      throw new NegocioException("Solo se puede hacer precheck de trabajos en estado ENVIADO");
    }
    if (apto) {
      trabajo.setEstado(EstadoTrabajo.PRECHECK_OK);
      if (observaciones != null && !observaciones.isBlank()) {
        trabajo.setObservacionesPrecheck(observaciones.trim());
      }
      Trabajo guardado = trabajoDAO.modificar(trabajo);
      notificarAutorPlantilla(guardado, "PRECHECK_OK", null);
      return guardado;
    }
    int intentos = trabajo.getPrecheckIntentos() + 1;
    trabajo.setPrecheckIntentos(intentos);
    if (observaciones != null && !observaciones.isBlank()) {
      trabajo.setObservacionesPrecheck(observaciones.trim());
    }
    if (intentos >= MAX_PRECHECK_INTENTOS) {
      trabajo.setEstado(EstadoTrabajo.RECHAZADO);
      notificarAutor(
          trabajo,
          "Trabajo no prevalidado",
          "Tu trabajo \"" + trabajo.getTitulo() + "\" no superó el precheck tras " + intentos + " intentos.");
    } else {
      trabajo.setEstado(EstadoTrabajo.PRECHECK_OBSERVADO);
      Map<String, String> vars = new HashMap<>();
      vars.put(
          "observaciones",
          observaciones != null && !observaciones.isBlank()
              ? observaciones.trim()
              : "Revisá los requisitos del congreso y corregí el trabajo.");
      vars.put("instruccion_reenvio", instruccionReenvio(trabajo));
      notificarAutorPlantilla(trabajo, "PRECHECK_OBSERVADO", vars);
    }
    Trabajo guardado = trabajoDAO.modificar(trabajo);
    return guardado;
  }

  public Trabajo confirmarAprobacionComite(Long id, boolean aprobar, String observaciones) {
    Trabajo trabajo = buscar(id);
    if (trabajo.getEstado() != EstadoTrabajo.PENDIENTE_APROBACION_COMITE) {
      throw new NegocioException(
          "Solo se puede confirmar trabajos pendientes de aprobación del comité");
    }
    if (aprobar) {
      trabajo.setEstado(EstadoTrabajo.APROBADO);
      Trabajo guardado = trabajoDAO.modificar(trabajo);
      notificarAutorPlantilla(guardado, "COMITE_APROBADO", null);
      if (guardado.getAutor() != null && pendienteHabilitacionAutor(guardado.getAutor())) {
        Map<String, String> vars = variablesBaseTrabajo(guardado);
        Usuario asistente = guardado.getAutor();
        vars.put("nombre_asistente", asistente.getNombre() + " " + asistente.getApellido());
        vars.put("email_asistente", asistente.getEmail() != null ? asistente.getEmail() : "");
        notificacionService.enviarPorRolConPlantilla(
            Rol.ADMINISTRADOR, "PROMOCION_AUTOR_ADMIN", vars, null);
      }
      return guardado;
    } else {
      if (observaciones == null || observaciones.isBlank()) {
        throw new NegocioException("Debe indicar el motivo del rechazo definitivo");
      }
      trabajo.setEstado(EstadoTrabajo.RECHAZADO);
      notificarAutor(
          trabajo,
          "Trabajo rechazado",
          "Tu trabajo \"" + trabajo.getTitulo() + "\" fue rechazado. Motivo: " + observaciones);
    }
    return trabajoDAO.modificar(trabajo);
  }

  public void actualizarEstadoTrasEvaluaciones(Long trabajoId) {
    Trabajo trabajo = buscar(trabajoId);
    if (trabajo.getEstado() != EstadoTrabajo.EN_EVALUACION) {
      return;
    }
    var asignaciones = asignacionEvaluacionDAO.listarPorTrabajo(trabajoId);
    long evaluacionesCompletas =
        asignaciones.stream()
            .filter(a -> a.isAceptada() && a.getEvaluacion() != null)
            .count();
    if (evaluacionesCompletas < 1) {
      return;
    }
    long aprobaciones =
        asignaciones.stream()
            .filter(
                a ->
                    a.isAceptada()
                        && a.getEvaluacion() != null
                        && (a.getEvaluacion().getRecomendacion() == RecomendacionEvaluacion.APROBADO
                            || a.getEvaluacion().getRecomendacion()
                                == RecomendacionEvaluacion.APROBADO_CON_CORRECCIONES))
            .count();
    long rechazos =
        asignaciones.stream()
            .filter(
                a ->
                    a.isAceptada()
                        && a.getEvaluacion() != null
                        && a.getEvaluacion().getRecomendacion() == RecomendacionEvaluacion.RECHAZADO)
            .count();

    if (aprobaciones >= 2) {
      trabajo.setEstado(EstadoTrabajo.PENDIENTE_APROBACION_COMITE);
      notificarAutorPlantilla(trabajo, "EVALUACION_FAVORABLE", null);
      notificacionService.enviarPorRol(
          Rol.ORGANIZADOR_CIENTIFICO,
          "Confirmar trabajo tras evaluaciones",
          "El trabajo \"" + trabajo.getTitulo() + "\" tiene 2 aprobaciones de evaluadores.",
          null);
    } else if (rechazos >= 2) {
      trabajo.setEstado(EstadoTrabajo.RECHAZADO);
      notificarAutorPlantilla(trabajo, "EVALUACION_RECHAZADO_FINAL", null);
    } else if (rechazos >= 1 && aprobaciones < 2) {
      int intentos = trabajo.getRevisionIntentos() + 1;
      trabajo.setRevisionIntentos(intentos);
      if (intentos >= MAX_REVISION_INTENTOS) {
        trabajo.setEstado(EstadoTrabajo.RECHAZADO);
        notificarAutorPlantilla(trabajo, "EVALUACION_RECHAZADO_FINAL", null);
      } else {
        trabajo.setEstado(EstadoTrabajo.OBSERVADO_EVALUACION);
        limpiarAsignaciones(trabajoId);
        Map<String, String> vars = new HashMap<>();
        vars.put("instruccion_reenvio", instruccionReenvio(trabajo));
        notificarAutorPlantilla(trabajo, "EVALUACION_RECHAZADO_REENVIO", vars);
      }
    }
    trabajoDAO.modificar(trabajo);
  }

  public Trabajo adjuntarDocumento(Long id, InputStream contenido, String filename) {
    Trabajo trabajo = buscar(id);
    String urlAnterior = trabajo.getDocumentoUrl();
    try {
      String url =
          documentStorageService.guardar(
              DocumentStorageService.TipoArchivo.TRABAJO, filename, contenido);
      trabajo.setDocumentoUrl(url);
      Trabajo guardado = trabajoDAO.modificar(trabajo);
      documentStorageService.eliminarPorUrl(urlAnterior);
      return guardado;
    } catch (IOException e) {
      throw new NegocioException("No se pudo guardar el documento: " + e.getMessage());
    }
  }

  public void baja(Long id) {
    Trabajo trabajo = buscar(id);
    String documentoUrl = trabajo.getDocumentoUrl();
    actividadDAO.desvincularTrabajo(id);
    limpiarAsignaciones(id);
    trabajoDAO.baja(id);
    documentStorageService.eliminarPorUrl(documentoUrl);
  }

  private void validarLimiteNuevoEnvio(Usuario autor, Rol rolEnvio) {
    boolean tieneAutor = autor.getRoles().contains(Rol.AUTOR);
    boolean tieneAsistente = autor.getRoles().contains(Rol.ASISTENTE);
    if (rolEnvio == Rol.ASISTENTE && tieneAutor && tieneAsistente) {
      throw new NegocioException(
          "Tu cuenta tiene rol autor y asistente. Enviá trabajos desde el panel Autor.");
    }
    LocalDate deadline = congresoDAO.obtenerPrincipal().getEnvioTrabajosHasta();
    if (deadline != null && LocalDate.now().isAfter(deadline)) {
      throw new NegocioException("No se permiten envíos nuevos: se superó la fecha límite.");
    }
    List<Trabajo> todos =
        trabajoDAO.listarFiltrado(
            new TrabajoFiltro(null, null, null, null, null, null, autor.getId()), 0, 200);
    List<Trabajo> cientificos =
        todos.stream().filter(t -> t.getTipo() != TipoTrabajo.PROPUESTA_TALLER).toList();
    List<Trabajo> delRol = filtrarPorRolEnvio(cientificos, rolEnvio, tieneAutor, tieneAsistente);
    long activos = delRol.stream().filter(this::esTrabajoActivoParaCupo).count();
    int limite = limiteActivos(autor, rolEnvio);
    if (activos >= limite) {
      throw new NegocioException(
          "Ya alcanzaste el máximo de " + limite + " trabajo(s) activo(s) como " + rolEnvio.name().toLowerCase());
    }
  }

  private int limiteActivos(Usuario autor, Rol rolEnvio) {
    boolean tieneAutor = autor.getRoles().contains(Rol.AUTOR);
    boolean tieneAsistente = autor.getRoles().contains(Rol.ASISTENTE);
    if (rolEnvio == Rol.ASISTENTE) {
      return 1;
    }
    if (tieneAutor && tieneAsistente) {
      return 1;
    }
    return 2;
  }

  private List<Trabajo> filtrarPorRolEnvio(
      List<Trabajo> trabajos, Rol rolEnvio, boolean tieneAutor, boolean tieneAsistente) {
    return trabajos.stream()
        .filter(
            t -> {
              if (t.getRolEnvio() != null) {
                return t.getRolEnvio() == rolEnvio;
              }
              if (tieneAutor && tieneAsistente) {
                return rolEnvio == Rol.AUTOR;
              }
              if (tieneAutor) {
                return rolEnvio == Rol.AUTOR;
              }
              return rolEnvio == Rol.ASISTENTE;
            })
        .toList();
  }

  private boolean esTrabajoActivoParaCupo(Trabajo t) {
    if (t.getEstado() == EstadoTrabajo.RECHAZADO || t.getEstado() == EstadoTrabajo.BORRADOR) {
      return false;
    }
    if (t.getEstado() == EstadoTrabajo.OBSERVADO_EVALUACION) {
      return false;
    }
    if (t.getEstado() == EstadoTrabajo.PRECHECK_OBSERVADO) {
      return false;
    }
    return true;
  }

  private boolean puedeReenviar(Trabajo t) {
    if (t.getEstado() == EstadoTrabajo.PRECHECK_OBSERVADO
        && t.getPrecheckIntentos() > 0
        && t.getPrecheckIntentos() < MAX_PRECHECK_INTENTOS) {
      return true;
    }
    return t.getEstado() == EstadoTrabajo.OBSERVADO_EVALUACION
        && t.getRevisionIntentos() < MAX_REVISION_INTENTOS;
  }

  private boolean puedeEditar(Trabajo t) {
    return t.getEstado() == EstadoTrabajo.BORRADOR
        || puedeReenviar(t);
  }

  /** Asistente sin AUTOR, o con AUTOR otorgado por error al crear el borrador (sin habilitación admin). */
  private boolean pendienteHabilitacionAutor(Usuario usuario) {
    if (!usuario.getRoles().contains(Rol.ASISTENTE)) {
      return false;
    }
    if (!usuario.getRoles().contains(Rol.AUTOR)) {
      return true;
    }
    return usuario.getRolActual() == null || usuario.getRolActual() == Rol.ASISTENTE;
  }

  private Rol resolverRolEnvio(String rolEnvioRaw, Usuario autor) {
    if (rolEnvioRaw != null && !rolEnvioRaw.isBlank()) {
      try {
        Rol rol = Rol.valueOf(rolEnvioRaw.trim().toUpperCase());
        if (rol != Rol.ASISTENTE && rol != Rol.AUTOR) {
          throw new NegocioException("rolEnvio debe ser ASISTENTE o AUTOR");
        }
        return rol;
      } catch (IllegalArgumentException e) {
        throw new NegocioException("rolEnvio inválido");
      }
    }
    if (autor.getRoles().contains(Rol.AUTOR) && !autor.getRoles().contains(Rol.ASISTENTE)) {
      return Rol.AUTOR;
    }
    if (autor.getRoles().contains(Rol.ASISTENTE) && !autor.getRoles().contains(Rol.AUTOR)) {
      return Rol.ASISTENTE;
    }
    return Rol.AUTOR;
  }

  private void limpiarAsignaciones(Long trabajoId) {
    List<AsignacionEvaluacion> actuales = asignacionEvaluacionDAO.listarPorTrabajo(trabajoId);
    for (AsignacionEvaluacion a : actuales) {
      asignacionEvaluacionDAO.baja(a.getId());
    }
  }

  private void validarDatosPostulacion(Trabajo trabajo) {
    if (trabajo.getTipo() == TipoTrabajo.PROPUESTA_TALLER) {
      if (trabajo.getTitulo() == null || trabajo.getTitulo().isBlank()) {
        throw new NegocioException("Debe indicar el título del taller");
      }
      if (trabajo.getResumen() == null || trabajo.getResumen().isBlank()) {
        throw new NegocioException("Debe indicar la descripción del taller");
      }
      if (trabajo.getMetodologia() == null || trabajo.getMetodologia().isBlank()) {
        throw new NegocioException("Debe indicar la metodología del taller");
      }
      return;
    }
    if (trabajo.getModalidad() == null) {
      throw new NegocioException("Debe indicar la modalidad de presentación (Oral o Póster)");
    }
    if (!EjesTematicos.esValido(trabajo.getEjeTematico())) {
      throw new NegocioException("Debe seleccionar un eje temático válido");
    }
  }

  private void validarPropuestaTallerUnica(Long autorId) {
    TrabajoFiltro filtro =
        new TrabajoFiltro(null, null, null, null, null, TipoTrabajo.PROPUESTA_TALLER, autorId);
    List<Trabajo> existentes = trabajoDAO.listarFiltrado(filtro, 0, 50);
    boolean tieneActiva =
        existentes.stream().anyMatch(t -> t.getEstado() != EstadoTrabajo.RECHAZADO);
    if (tieneActiva) {
      throw new NegocioException(
          "Ya tenés una propuesta de taller activa (pendiente o aprobada). No podés enviar otra.");
    }
  }

  public List<TrabajoResumenDTO> listarPropuestasTallerPendientes(Long evaluadorId) {
    Usuario evaluador = usuarioDAO.recuperarPorId(evaluadorId);
    if (evaluador == null || !evaluador.getRoles().contains(Rol.EVALUADOR)) {
      throw new NegocioException("Solo evaluadores pueden listar propuestas de taller");
    }
    TrabajoFiltro filtro =
        new TrabajoFiltro(
            null, null, null, EstadoTrabajo.ENVIADO, null, TipoTrabajo.PROPUESTA_TALLER, null);
    return trabajoDAO.listarFiltrado(filtro, 0, 200).stream()
        .filter(t -> t.getAutor() == null || !evaluadorId.equals(t.getAutor().getId()))
        .map(TrabajoResumenDTO::from)
        .toList();
  }

  public Trabajo evaluarPropuestaTaller(
      Long id, boolean aprobar, String comentario, Long evaluadorId) {
    Usuario evaluador = usuarioDAO.recuperarPorId(evaluadorId);
    if (evaluador == null || !evaluador.getRoles().contains(Rol.EVALUADOR)) {
      throw new NegocioException("Solo evaluadores pueden evaluar propuestas de taller");
    }
    Trabajo trabajo = buscar(id);
    if (trabajo.getTipo() != TipoTrabajo.PROPUESTA_TALLER) {
      throw new NegocioException("El trabajo no es una propuesta de taller");
    }
    if (trabajo.getEstado() != EstadoTrabajo.ENVIADO) {
      throw new NegocioException("La propuesta ya fue evaluada");
    }
    if (trabajo.getAutor() != null && evaluadorId.equals(trabajo.getAutor().getId())) {
      throw new NegocioException("No podés evaluar tu propia propuesta");
    }
    LocalDate evaluacionHasta = congresoDAO.obtenerPrincipal().getEvaluacionHasta();
    if (evaluacionHasta != null && LocalDate.now().isAfter(evaluacionHasta)) {
      throw new NegocioException(
          "El período de evaluación cerró el "
              + evaluacionHasta
              + ". Ya no se pueden registrar dictámenes.");
    }
    trabajo.setEstado(aprobar ? EstadoTrabajo.APROBADO : EstadoTrabajo.RECHAZADO);
    if (comentario != null && !comentario.isBlank()) {
      trabajo.setObservacionesPrecheck(comentario.trim());
    }
    Trabajo guardado = trabajoDAO.modificar(trabajo);
    notificarAutor(
        guardado,
        aprobar ? "Taller aprobado" : "Taller no aprobado",
        aprobar
            ? "Tu propuesta de taller \""
                + guardado.getTitulo()
                + "\" fue aprobada."
                + (comentario != null && !comentario.isBlank()
                    ? " Comentario: " + comentario.trim()
                    : "")
            : "Tu propuesta de taller \""
                + guardado.getTitulo()
                + "\" no fue aprobada."
                + (comentario != null && !comentario.isBlank()
                    ? " Comentario: " + comentario.trim()
                    : ""));
    return guardado;
  }

  private boolean esEnvioAsistente(Trabajo trabajo) {
    return trabajo.getRolEnvio() == null || trabajo.getRolEnvio() == Rol.ASISTENTE;
  }

  private String sufijoRolEnvio(Trabajo trabajo) {
    return esEnvioAsistente(trabajo) ? " (enviado como asistente)" : " (enviado como autor)";
  }

  private String instruccionReenvio(Trabajo trabajo) {
    if (esEnvioAsistente(trabajo)) {
      return " Reenviá desde el panel asistente. Si el trabajo se aprueba, el administrador te habilitará el rol Autor.";
    }
    return " Reenviá desde Mis trabajos.";
  }

  private void notificarAutor(Trabajo trabajo, String asunto, String mensaje) {
    if (trabajo.getAutor() != null && trabajo.getAutor().getId() != null) {
      notificacionService.enviar(trabajo.getAutor().getId(), asunto, mensaje);
    }
  }

  private void notificarAutorPlantilla(
      Trabajo trabajo, String nombrePlantilla, Map<String, String> variablesExtra) {
    if (trabajo.getAutor() == null || trabajo.getAutor().getId() == null) {
      return;
    }
    Map<String, String> vars = variablesBaseTrabajo(trabajo);
    if (variablesExtra != null) {
      vars.putAll(variablesExtra);
    }
    notificacionService.enviarConPlantilla(
        trabajo.getAutor().getId(), nombrePlantilla, vars);
  }

  private Map<String, String> variablesBaseTrabajo(Trabajo trabajo) {
    Map<String, String> vars = new HashMap<>();
    vars.put("titulo", trabajo.getTitulo() != null ? trabajo.getTitulo() : "");
    if (trabajo.getAutor() != null) {
      vars.put(
          "nombre",
          (trabajo.getAutor().getNombre() + " " + trabajo.getAutor().getApellido()).trim());
    }
    return vars;
  }
}
