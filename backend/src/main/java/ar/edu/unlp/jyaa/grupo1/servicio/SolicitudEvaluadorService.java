package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.SolicitudEvaluadorDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoSolicitudEvaluador;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.SolicitudEvaluador;
import ar.edu.unlp.jyaa.grupo1.modelo.SolicitudEvaluadorCapacidad;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CapacidadEjeRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.SolicitudEvaluadorCreateRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.ValidarSolicitudEvaluadorRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaSolicitudesEvaluadorDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.SolicitudEvaluadorDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RequestScoped
public class SolicitudEvaluadorService {

  private static final int SIZE_MAX = 100;
  private static final Set<String> FORMACIONES =
      Set.of(
          "GRADO",
          "POSGRADO",
          "DIPLOMATURA",
          "MAESTRIA",
          "DOCTORADO",
          "NINGUNA",
          "OTROS");
  private static final Set<String> TIPOS_ID = Set.of("DNI", "PASAPORTE");
  private static final Set<String> AREAS =
      Set.of(
          "AGRICULTURA_INTENSIVA",
          "AGRICULTURA_EXTENSIVA",
          "AGRICULTURA_URBANA",
          "GANADERIA",
          "APICULTURA",
          "SISTEMAS_MIXTOS",
          "PUEBLOS_INDIGENAS",
          "GENERO",
          "OTROS");

  @Inject private SolicitudEvaluadorDAO solicitudDAO;
  @Inject private UsuarioDAO usuarioDAO;
  @Inject private CatalogoCongresoService catalogoCongresoService;
  @Inject private EvaluadorEjeService evaluadorEjeService;
  @Inject private NotificacionService notificacionService;

  public SolicitudEvaluadorDTO miSolicitud(Long usuarioId) {
    return solicitudDAO
        .buscarUltimaPorUsuario(usuarioId)
        .map(this::toDtoConCupos)
        .orElse(null);
  }

  public SolicitudEvaluadorDTO crear(Long usuarioId, SolicitudEvaluadorCreateRequest req) {
    if (req == null) {
      throw new NegocioException("Datos de solicitud requeridos");
    }
    Usuario usuario = usuarioDAO.recuperarPorId(usuarioId);
    if (usuario == null) {
      throw new NegocioException("Usuario no encontrado");
    }
    if (usuario.getRoles() != null && usuario.getRoles().contains(Rol.EVALUADOR)) {
      throw new NegocioException("Ya tenés el rol de evaluador");
    }
    if (solicitudDAO.buscarPendientePorUsuario(usuarioId).isPresent()) {
      throw new NegocioException("Ya tenés una solicitud pendiente de evaluación");
    }

    validarCreate(req);

    SolicitudEvaluador s = new SolicitudEvaluador();
    s.setUsuario(usuario);
    s.setEstado(EstadoSolicitudEvaluador.PENDIENTE);
    s.setFechaSolicitud(LocalDateTime.now());
    s.setNombreCompleto(req.nombreCompleto().trim());
    s.setEmail(req.email().trim().toLowerCase());
    s.setTipoIdentificacion(req.tipoIdentificacion().trim().toUpperCase());
    s.setNumeroIdentificacion(req.numeroIdentificacion().trim());
    s.setNacionalidad(req.nacionalidad().trim());
    s.setInstitucion(blankToNull(req.institucion()));
    s.setEvaluoEdicionesCongreso(req.evaluoEdicionesCongreso());
    s.setEvaluoOtrosCongresos(req.evaluoOtrosCongresos());
    s.setFormacionAgroecologia(req.formacionAgroecologia().trim().toUpperCase());
    s.setAreasConocimiento(
        req.areasConocimiento().stream().map(a -> a.trim().toUpperCase()).collect(java.util.stream.Collectors.toSet()));
    s.setSubareas(
        req.subareas() != null
            ? req.subareas().stream()
                .filter(x -> x != null && !x.isBlank())
                .map(x -> x.trim().toUpperCase())
                .collect(java.util.stream.Collectors.toSet())
            : new HashSet<>());
    s.setObservaciones(blankToNull(req.observaciones()));
    s.setInvitacionTallerEnviada(false);

    for (CapacidadEjeRequest c : req.capacidades()) {
      if (c == null || c.capacidad() <= 0) {
        continue;
      }
      if (!catalogoCongresoService.esEjeActivo(c.ejeTematico())) {
        throw new NegocioException("Eje temático inválido: " + c.ejeTematico());
      }
      SolicitudEvaluadorCapacidad cap = new SolicitudEvaluadorCapacidad();
      cap.setSolicitud(s);
      cap.setEjeTematico(c.ejeTematico().trim());
      cap.setCapacidad(c.capacidad());
      s.getCapacidades().add(cap);
    }
    if (s.getCapacidades().isEmpty()) {
      throw new NegocioException("Indicá capacidad mayor a 0 en al menos un eje temático");
    }

    SolicitudEvaluador guardada = solicitudDAO.alta(s);
    notificarComiteNuevaSolicitud(guardada);
    // Paso 4: invitación al taller al postularse (no garantiza trabajos).
    enviarInvitacionTaller(guardada);
    return toDtoConCupos(requireSolicitud(guardada.getId()));
  }

  public PaginaSolicitudesEvaluadorDTO listar(
      int page, int size, String estado, AuthenticatedUser auth) {
    if (!auth.canGestionarEvaluadoresEje()) {
      throw new NegocioException("Solo comité académico o administrador");
    }
    int safePage = Math.max(1, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;

    EstadoSolicitudEvaluador est = parseEstado(estado);
    long total =
        est == null ? solicitudDAO.contarTodas() : solicitudDAO.contarPorEstado(est);
    List<SolicitudEvaluadorDTO> items =
        (est == null
                ? solicitudDAO.listarTodas(offset, safeSize)
                : solicitudDAO.listarPorEstado(est, offset, safeSize))
            .stream()
            .map(this::toDtoConCupos)
            .toList();
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);
    return new PaginaSolicitudesEvaluadorDTO(items, safePage, safeSize, total, totalPages);
  }

  public SolicitudEvaluadorDTO obtener(Long id, AuthenticatedUser auth) {
    SolicitudEvaluador s = requireSolicitud(id);
    if (!auth.canGestionarEvaluadoresEje() && !auth.userId().equals(s.getUsuario().getId())) {
      throw new NegocioException("No tenés permiso para ver esta solicitud");
    }
    return toDtoConCupos(s);
  }

  public SolicitudEvaluadorDTO validar(
      Long id, ValidarSolicitudEvaluadorRequest req, AuthenticatedUser auth) {
    if (!auth.canGestionarEvaluadoresEje()) {
      throw new NegocioException("Solo comité académico o administrador");
    }
    if (req == null) {
      throw new NegocioException("Datos de validación requeridos");
    }
    SolicitudEvaluador s = requireSolicitud(id);
    if (s.getEstado() != EstadoSolicitudEvaluador.PENDIENTE) {
      throw new NegocioException("La solicitud ya fue resuelta");
    }
    Usuario revisor = usuarioDAO.recuperarPorId(auth.userId());
    s.setFechaRevision(LocalDateTime.now());
    s.setRevisadoPor(revisor);

    if (req.aprobar()) {
      Map<String, Integer> caps = new LinkedHashMap<>();
      if (s.getCapacidades() != null) {
        for (var c : s.getCapacidades()) {
          if (c.getCapacidad() > 0 && catalogoCongresoService.esEjeActivo(c.getEjeTematico())) {
            caps.put(c.getEjeTematico().trim(), c.getCapacidad());
          }
        }
      }
      if (caps.isEmpty()) {
        throw new NegocioException(
            "La solicitud no tiene ejes con capacidad > 0 para asignar");
      }
      // Primero cupos + rol (si falla, no marcar aprobada).
      Long usuarioId = s.getUsuario().getId();
      evaluadorEjeService.asignarCuposDesdeSolicitud(usuarioId, caps);
      s.setEstado(EstadoSolicitudEvaluador.APROBADA);
      s.setMotivoRechazo(null);
      // Resumen corto: los nombres completos van en cuposAsignados / capacidades (evitar truncar BD).
      s.setEjeAsignado(caps.size() + " ejes con cupo (capacidad de la solicitud)");
      solicitudDAO.modificar(s);
      notificarAprobacion(s);
      if (req.enviarInvitacionTaller()) {
        enviarInvitacionTaller(s);
      }
    } else {
      String motivo = req.motivoRechazo() != null ? req.motivoRechazo().trim() : "";
      if (motivo.isBlank()) {
        throw new NegocioException("Indicá el motivo del rechazo");
      }
      s.setEstado(EstadoSolicitudEvaluador.RECHAZADA);
      s.setMotivoRechazo(motivo);
      solicitudDAO.modificar(s);
      notificarRechazo(s);
    }
    return toDtoConCupos(requireSolicitud(id));
  }

  public SolicitudEvaluadorDTO invitarTaller(Long id, AuthenticatedUser auth) {
    if (!auth.canGestionarEvaluadoresEje()) {
      throw new NegocioException("Solo comité académico o administrador");
    }
    SolicitudEvaluador s = requireSolicitud(id);
    enviarInvitacionTaller(s);
    return toDtoConCupos(requireSolicitud(id));
  }

  /**
   * Al retirar el rol EVALUADOR: las solicitudes APROBADAS pasan a REVOCADA para que el usuario
   * pueda volver a postularse. Se conserva el historial para el comité.
   */
  public void revocarAprobadasPorRetiroDeRol(Long usuarioId) {
    if (usuarioId == null) {
      return;
    }
    List<SolicitudEvaluador> aprobadas =
        solicitudDAO.listarPorUsuarioYEstado(usuarioId, EstadoSolicitudEvaluador.APROBADA);
    if (aprobadas.isEmpty()) {
      return;
    }
    LocalDateTime ahora = LocalDateTime.now();
    for (SolicitudEvaluador s : aprobadas) {
      s.setEstado(EstadoSolicitudEvaluador.REVOCADA);
      s.setFechaRevision(ahora);
      s.setMotivoRechazo(
          "Rol EVALUADOR retirado. Podés volver a enviar una solicitud si querés reintegrarte.");
      s.setEjeAsignado(null);
      solicitudDAO.modificar(s);
    }
  }

  private void enviarInvitacionTaller(SolicitudEvaluador s) {
    Map<String, String> vars = new HashMap<>();
    vars.put(
        "contexto",
        "Te invitamos al taller de evaluadorxs (previsto entre el 11 y el 15 de agosto). "
            + "Anotarse y hacer el taller no garantiza recibir un trabajo para evaluar: "
            + "depende de los cupos y de los trabajos por eje temático.");
    vars.put(
        "proximo_paso",
        "Si todavía no completaste tu solicitud de evaluador/a, podés hacerlo desde la plataforma.");
    vars.put("enlace", "/solicitud-evaluador");
    notificacionService.enviarConPlantilla(
        s.getUsuario().getId(), "TALLER_EVALUADORES_INVITACION", vars);
    s.setInvitacionTallerEnviada(true);
    solicitudDAO.modificar(s);
  }

  private void notificarComiteNuevaSolicitud(SolicitudEvaluador s) {
    for (Usuario u : usuarioDAO.listarPaginado(0, 500)) {
      if (u.getRoles() == null) {
        continue;
      }
      if (u.getRoles().contains(Rol.ORGANIZADOR_CIENTIFICO)
          || u.getRoles().contains(Rol.ADMINISTRADOR)) {
        Map<String, String> vars = new HashMap<>();
        vars.put("postulante", s.getNombreCompleto());
        vars.put("email_postulante", s.getEmail());
        vars.put("enlace", "/organizador/solicitudes-evaluador");
        vars.put(
            "contexto",
            "Nueva solicitud para integrar el comité de evaluadores. Revisá el perfil y las "
                + "capacidades por eje antes de aprobar o rechazar.");
        notificacionService.enviarConPlantilla(u.getId(), "SOLICITUD_EVALUADOR_PENDIENTE_COMITE", vars);
      }
    }
  }

  private void notificarAprobacion(SolicitudEvaluador s) {
    Map<String, String> vars = new HashMap<>();
    vars.put("eje", s.getEjeAsignado() != null ? s.getEjeAsignado() : "");
    vars.put("enlace", "/evaluador");
    vars.put(
        "contexto",
        "Tu solicitud para integrar el comité de evaluadores fue aprobada. "
            + "Quedaste habilitado/a como evaluador/a en los ejes con capacidad declarada.");
    vars.put(
        "proximo_paso",
        "Recordá: el taller de evaluadorxs no garantiza recibir trabajos; depende de cupos restantes por eje.");
    notificacionService.enviarConPlantilla(
        s.getUsuario().getId(), "SOLICITUD_EVALUADOR_APROBADA", vars);
  }

  private void notificarRechazo(SolicitudEvaluador s) {
    Map<String, String> vars = new HashMap<>();
    vars.put("motivo", s.getMotivoRechazo() != null ? s.getMotivoRechazo() : "");
    vars.put("enlace", "/solicitud-evaluador");
    vars.put("contexto", "Tu solicitud para integrar el comité de evaluadores fue rechazada.");
    notificacionService.enviarConPlantilla(
        s.getUsuario().getId(), "SOLICITUD_EVALUADOR_RECHAZADA", vars);
  }

  private void validarCreate(SolicitudEvaluadorCreateRequest req) {
    requireText(req.nombreCompleto(), "nombre completo");
    requireText(req.email(), "email");
    if (req.email() == null || !req.email().contains("@")) {
      throw new NegocioException("Email inválido");
    }
    if (req.tipoIdentificacion() == null
        || !TIPOS_ID.contains(req.tipoIdentificacion().trim().toUpperCase())) {
      throw new NegocioException("Tipo de identificación inválido (DNI o PASAPORTE)");
    }
    requireText(req.numeroIdentificacion(), "número de identificación");
    requireText(req.nacionalidad(), "nacionalidad");
    if (req.formacionAgroecologia() == null
        || !FORMACIONES.contains(req.formacionAgroecologia().trim().toUpperCase())) {
      throw new NegocioException("Formación en agroecología inválida");
    }
    if (req.areasConocimiento() == null || req.areasConocimiento().isEmpty()) {
      throw new NegocioException("Seleccioná al menos un área de conocimiento");
    }
    for (String a : req.areasConocimiento()) {
      if (a == null || !AREAS.contains(a.trim().toUpperCase())) {
        throw new NegocioException("Área de conocimiento inválida: " + a);
      }
    }
    if (req.capacidades() == null || req.capacidades().isEmpty()) {
      throw new NegocioException("Completá la capacidad por eje temático");
    }
  }

  private SolicitudEvaluadorDTO toDtoConCupos(SolicitudEvaluador s) {
    if (s == null) {
      return null;
    }
    Long uid = s.getUsuario() != null ? s.getUsuario().getId() : null;
    if (uid == null
        || (s.getEstado() != EstadoSolicitudEvaluador.APROBADA
            && s.getEstado() != EstadoSolicitudEvaluador.REVOCADA)) {
      return SolicitudEvaluadorDTO.from(s, List.of());
    }
    return SolicitudEvaluadorDTO.from(s, evaluadorEjeService.listarCuposDto(uid));
  }

  private SolicitudEvaluador requireSolicitud(Long id) {
    SolicitudEvaluador s = solicitudDAO.recuperarPorId(id);
    if (s == null) {
      throw new NegocioException("Solicitud no encontrada: " + id);
    }
    return s;
  }

  private static EstadoSolicitudEvaluador parseEstado(String estado) {
    if (estado == null || estado.isBlank()) {
      return null;
    }
    try {
      return EstadoSolicitudEvaluador.valueOf(estado.trim().toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new NegocioException("Estado inválido: " + estado);
    }
  }

  private static void requireText(String value, String label) {
    if (value == null || value.isBlank()) {
      throw new NegocioException("Campo obligatorio: " + label);
    }
  }

  private static String blankToNull(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }
}
