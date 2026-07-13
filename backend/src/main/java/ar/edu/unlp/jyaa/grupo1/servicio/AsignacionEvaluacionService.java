package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.AsignacionEvaluacionDAO;
import ar.edu.unlp.jyaa.grupo1.dao.TrabajoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.AsignacionEvaluadorFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadPresentacion;
import ar.edu.unlp.jyaa.grupo1.modelo.RecomendacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.web.dto.AsignacionEvaluacionDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaAsignacionesDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.ResumenAsignacionesEvaluadorDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RequestScoped
public class AsignacionEvaluacionService {

  private static final int MAX_EVALUADORES = 2;
  private static final int MAX_EVALUADORES_EMPATE = 3;

  @Inject private AsignacionEvaluacionDAO asignacionEvaluacionDAO;
  @Inject private TrabajoDAO trabajoDAO;
  @Inject private NotificacionService notificacionService;
  @Inject private UsuarioDAO usuarioDAO;

  public AsignacionEvaluacion asignar(Long trabajoId, Long evaluadorId) {
    return asignarInterno(trabajoId, evaluadorId, false);
  }

  public List<AsignacionEvaluacion> asignarVarios(
      Long trabajoId, List<Long> evaluadorIds, boolean tercerEvaluadorEmpate) {
    if (evaluadorIds == null || evaluadorIds.isEmpty()) {
      throw new NegocioException("Debe indicar al menos un evaluador");
    }
    Set<Long> unicos = new LinkedHashSet<>(evaluadorIds);
    Trabajo trabajo = trabajoDAO.recuperarPorId(trabajoId);
    if (trabajo == null) {
      throw new NegocioException("Trabajo no encontrado: " + trabajoId);
    }
    validarEstadoParaAsignar(trabajo);

    List<AsignacionEvaluacion> actuales = asignacionEvaluacionDAO.listarPorTrabajo(trabajoId);
    boolean empate = esEmpate(actuales);
    int maxPermitido = empate || tercerEvaluadorEmpate ? MAX_EVALUADORES_EMPATE : MAX_EVALUADORES;
    int requeridos = empate || tercerEvaluadorEmpate ? MAX_EVALUADORES_EMPATE : MAX_EVALUADORES;

    long activas = actuales.size();
    long nuevas = unicos.stream().filter(id -> asignacionEvaluacionDAO.buscarActiva(trabajoId, id).isEmpty()).count();
    if (activas + nuevas > maxPermitido) {
      throw new NegocioException("El trabajo admite como máximo " + maxPermitido + " evaluadores");
    }
    if (!empate && !tercerEvaluadorEmpate && unicos.size() < requeridos) {
      throw new NegocioException("Seleccioná " + requeridos + " evaluadores del eje temático");
    }

    List<AsignacionEvaluacion> creadas = new ArrayList<>();
    for (Long evaluadorId : unicos) {
      if (asignacionEvaluacionDAO.buscarActiva(trabajoId, evaluadorId).isPresent()) {
        continue;
      }
      creadas.add(asignarInterno(trabajoId, evaluadorId, empate || tercerEvaluadorEmpate));
    }
    if (creadas.isEmpty()) {
      boolean todosYaAsignados =
          unicos.stream()
              .allMatch(id -> asignacionEvaluacionDAO.buscarActiva(trabajoId, id).isPresent());
      if (todosYaAsignados) {
        return actuales.stream()
            .filter(a -> a.getEvaluador() != null && unicos.contains(a.getEvaluador().getId()))
            .toList();
      }
      throw new NegocioException("No hay evaluadores nuevos para asignar");
    }
    return creadas;
  }

  private AsignacionEvaluacion asignarInterno(Long trabajoId, Long evaluadorId, boolean permiteTercero) {
    Trabajo trabajo = trabajoDAO.recuperarPorId(trabajoId);
    if (trabajo == null) {
      throw new NegocioException("Trabajo no encontrado: " + trabajoId);
    }
    validarEstadoParaAsignar(trabajo);

    Usuario evaluador = usuarioDAO.recuperarPorId(evaluadorId);
    if (evaluador == null) {
      throw new NegocioException("Evaluador no encontrado: " + evaluadorId);
    }
    if (!evaluador.getRoles().contains(Rol.EVALUADOR)) {
      throw new NegocioException("El usuario no tiene rol de evaluador");
    }
    String ejeTrabajo = trabajo.getEjeTematico();
    if (ejeTrabajo == null || ejeTrabajo.isBlank()) {
      throw new NegocioException("El trabajo no tiene eje temático");
    }
    if (evaluador.getEjeTematicoEvaluador() == null
        || !ejeTrabajo.equals(evaluador.getEjeTematicoEvaluador())) {
      throw new NegocioException("El evaluador no está asignado al eje temático del trabajo");
    }
    if (trabajo.getAutor() != null && trabajo.getAutor().getId().equals(evaluadorId)) {
      throw new NegocioException("El autor del trabajo no puede ser evaluador del mismo");
    }
    if (asignacionEvaluacionDAO.buscarActiva(trabajoId, evaluadorId).isPresent()) {
      throw new NegocioException("El evaluador ya está asignado a este trabajo");
    }

    List<AsignacionEvaluacion> actuales = asignacionEvaluacionDAO.listarPorTrabajo(trabajoId);
    boolean empate = esEmpate(actuales);
    int max = empate || permiteTercero ? MAX_EVALUADORES_EMPATE : MAX_EVALUADORES;
    if (actuales.size() >= max) {
      throw new NegocioException("El trabajo ya tiene " + max + " evaluadores asignados");
    }

    AsignacionEvaluacion asignacion = new AsignacionEvaluacion();
    asignacion.setTrabajo(trabajo);
    asignacion.setEvaluador(evaluador);
    asignacion.setAceptada(false);
    trabajo.setEstado(EstadoTrabajo.EN_EVALUACION);
    trabajoDAO.modificar(trabajo);
    AsignacionEvaluacion creada = asignacionEvaluacionDAO.alta(asignacion);
    Map<String, String> vars = new HashMap<>();
    vars.put("titulo", trabajo.getTitulo());
    vars.put("eje", trabajo.getEjeTematico() != null ? trabajo.getEjeTematico() : "");
    vars.put("enlace", TrabajoNotificacionHelper.RUTA_EVALUADOR);
    vars.put(
        "proximo_paso",
        "Aceptá o rechazá la asignación en tu panel de evaluador antes de emitir el dictamen.");
    vars.put("contexto", TrabajoNotificacionHelper.contextoParticipante(trabajo));
    notificacionService.enviarConPlantilla(
        evaluador.getId(), "ASIGNACION_EVALUADOR", vars);
    return creada;
  }

  private boolean esEmpate(List<AsignacionEvaluacion> asignaciones) {
    int aprobaciones = 0;
    int rechazos = 0;
    for (AsignacionEvaluacion a : asignaciones) {
      if (!a.isAceptada() || a.getEvaluacion() == null) {
        continue;
      }
      RecomendacionEvaluacion rec = a.getEvaluacion().getRecomendacion();
      if (rec == RecomendacionEvaluacion.APROBADO
          || rec == RecomendacionEvaluacion.APROBADO_CON_CORRECCIONES) {
        aprobaciones++;
      } else if (rec == RecomendacionEvaluacion.RECHAZADO) {
        rechazos++;
      }
    }
    return aprobaciones == 1 && rechazos == 1;
  }

  private void validarEstadoParaAsignar(Trabajo trabajo) {
    if (trabajo.getEstado() == EstadoTrabajo.ENVIADO) {
      throw new NegocioException(
          "Debe marcar el trabajo como apto (precheck OK) antes de asignar evaluadores");
    }
    if (trabajo.getEstado() != EstadoTrabajo.PRECHECK_OK
        && trabajo.getEstado() != EstadoTrabajo.EN_EVALUACION) {
      throw new NegocioException(
          "Solo se pueden asignar evaluadores a trabajos con precheck OK o ya en evaluación");
    }
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

  public PaginaAsignacionesDTO listarPorEvaluador(
      Long evaluadorId, int page, int size, boolean soloPendientes, AsignacionEvaluadorFiltro filtro) {
    int safePage = Math.max(1, page);
    int safeSize = Math.min(Math.max(1, size), 100);
    int offset = (safePage - 1) * safeSize;
    AsignacionEvaluadorFiltro effective =
        filtro != null ? filtro : AsignacionEvaluadorFiltro.vacio();
    long total = asignacionEvaluacionDAO.contarPorEvaluador(evaluadorId, soloPendientes, effective);
    List<AsignacionEvaluacionDTO> items =
        asignacionEvaluacionDAO
            .listarPorEvaluadorPaginado(evaluadorId, soloPendientes, effective, offset, safeSize)
            .stream()
            .map(AsignacionEvaluacionDTO::from)
            .toList();
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);
    return new PaginaAsignacionesDTO(items, safePage, safeSize, total, totalPages);
  }

  public ResumenAsignacionesEvaluadorDTO resumenPorEvaluador(Long evaluadorId) {
    return new ResumenAsignacionesEvaluadorDTO(
        asignacionEvaluacionDAO.contarPorEvaluador(
            evaluadorId, true, AsignacionEvaluadorFiltro.vacio()),
        asignacionEvaluacionDAO.contarEvaluadasPorEvaluador(evaluadorId),
        asignacionEvaluacionDAO.contarAprobadasPorEvaluador(evaluadorId));
  }

  public static AsignacionEvaluadorFiltro parseFiltro(
      String tipo, String modalidad, String ejeTematico, String estado) {
    TipoTrabajo tipoEnum = null;
    if (tipo != null && !tipo.isBlank()) {
      try {
        tipoEnum = TipoTrabajo.valueOf(tipo.trim().toUpperCase());
      } catch (IllegalArgumentException ignored) {
        // filtro inválido → se ignora
      }
    }
    ModalidadPresentacion modalidadEnum = null;
    if (modalidad != null && !modalidad.isBlank()) {
      try {
        modalidadEnum = ModalidadPresentacion.valueOf(modalidad.trim().toUpperCase());
      } catch (IllegalArgumentException ignored) {
        // filtro inválido → se ignora
      }
    }
    EstadoTrabajo estadoEnum = null;
    if (estado != null && !estado.isBlank()) {
      try {
        estadoEnum = EstadoTrabajo.valueOf(estado.trim().toUpperCase());
      } catch (IllegalArgumentException ignored) {
        // filtro inválido → se ignora
      }
    }
    String eje = ejeTematico != null && !ejeTematico.isBlank() ? ejeTematico.trim() : null;
    return new AsignacionEvaluadorFiltro(tipoEnum, modalidadEnum, eje, estadoEnum);
  }

  public List<AsignacionEvaluacion> listarPorTrabajo(Long trabajoId) {
    return asignacionEvaluacionDAO.listarPorTrabajo(trabajoId);
  }

  public AsignacionEvaluacion responder(Long id, boolean aceptar) {
    AsignacionEvaluacion asignacion =
        asignacionEvaluacionDAO
            .recuperarPorIdConDetalle(id)
            .orElseThrow(() -> new NegocioException("Asignación no encontrada: " + id));
    if (asignacion.getFechaRespuesta() != null) {
      throw new NegocioException("La asignación ya fue respondida");
    }
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
