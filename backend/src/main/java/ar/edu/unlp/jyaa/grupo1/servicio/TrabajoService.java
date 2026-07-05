package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.AsignacionEvaluacionDAO;
import ar.edu.unlp.jyaa.grupo1.dao.TrabajoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.TrabajoFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.EjesTematicos;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadPresentacion;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaTrabajosDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.TrabajoResumenDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.List;

@RequestScoped
public class TrabajoService {

  private static final int MAX_PRECHECK_INTENTOS = 3;

  @Inject private TrabajoDAO trabajoDAO;
  @Inject private UsuarioDAO usuarioDAO;
  @Inject private AsignacionEvaluacionDAO asignacionEvaluacionDAO;
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
            .map(TrabajoResumenDTO::from)
            .toList();
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);

    return new PaginaTrabajosDTO(items, safePage, safeSize, total, totalPages);
  }

  public Trabajo buscar(Long id) {
    return trabajoDAO
        .recuperarPorIdConAutor(id)
        .orElseThrow(() -> new NegocioException("Trabajo no encontrado: " + id));
  }

  public Trabajo crear(Long autorId, Trabajo trabajo) {
    Usuario autor = usuarioDAO.recuperarPorId(autorId);
    if (autor == null) {
      throw new NegocioException("Autor no encontrado: " + autorId);
    }
    if (trabajo.getTipo() != TipoTrabajo.PROPUESTA_TALLER && !autor.getRoles().contains(Rol.AUTOR)) {
      autor.getRoles().add(Rol.AUTOR);
      usuarioDAO.modificar(autor);
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

  public Trabajo enviar(Long id) {
    Trabajo trabajo = buscar(id);
    if (trabajo.getEstado() != EstadoTrabajo.BORRADOR
        && trabajo.getEstado() != EstadoTrabajo.APROBADO_CON_CORRECCIONES) {
      throw new NegocioException(
          "Solo se pueden enviar trabajos en borrador o reenviar correcciones pendientes");
    }
    validarDatosPostulacion(trabajo);
    if (trabajo.getDocumentoUrl() == null || trabajo.getDocumentoUrl().isBlank()) {
      throw new NegocioException("Debe adjuntar el PDF antes de enviar el trabajo");
    }
    trabajo.setEstado(EstadoTrabajo.ENVIADO);
    notificarAutor(
        trabajo,
        "Trabajo enviado",
        "Tu trabajo \"" + trabajo.getTitulo() + "\" fue enviado y está pendiente de revisión del comité.");
    return trabajoDAO.modificar(trabajo);
  }

  public Trabajo registrarPrecheck(Long id, boolean apto) {
    Trabajo trabajo = buscar(id);
    if (trabajo.getEstado() != EstadoTrabajo.ENVIADO) {
      throw new NegocioException("Solo se puede hacer precheck de trabajos en estado ENVIADO");
    }
    if (apto) {
      trabajo.setEstado(EstadoTrabajo.PRECHECK_OK);
      notificarAutor(
          trabajo,
          "Precheck aprobado",
          "Tu trabajo \"" + trabajo.getTitulo() + "\" pasó el precheck del comité.");
      return trabajoDAO.modificar(trabajo);
    }
    int intentos = trabajo.getPrecheckIntentos() + 1;
    trabajo.setPrecheckIntentos(intentos);
    if (intentos >= MAX_PRECHECK_INTENTOS) {
      trabajo.setEstado(EstadoTrabajo.RECHAZADO);
      notificarAutor(
          trabajo,
          "Trabajo no prevalidado",
          "Tu trabajo \"" + trabajo.getTitulo() + "\" no superó el precheck tras " + intentos + " intentos.");
    } else {
      notificarAutor(
          trabajo,
          "Trabajo observado en precheck",
          "Tu trabajo \"" + trabajo.getTitulo() + "\" fue observado. Revisá los requisitos y reenviá si corresponde.");
    }
    return trabajoDAO.modificar(trabajo);
  }

  public Trabajo confirmarAprobacionComite(Long id, boolean aprobar, String observaciones) {
    Trabajo trabajo = buscar(id);
    if (trabajo.getEstado() != EstadoTrabajo.PENDIENTE_APROBACION_COMITE) {
      throw new NegocioException(
          "Solo se puede confirmar trabajos pendientes de aprobación del comité");
    }
    if (aprobar) {
      trabajo.setEstado(EstadoTrabajo.APROBADO);
      notificarAutor(
          trabajo,
          "Trabajo aprobado",
          "Tu trabajo \"" + trabajo.getTitulo() + "\" fue aprobado por el comité académico.");
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
    if (evaluacionesCompletas < 2) {
      return;
    }
    long aprobaciones =
        asignaciones.stream()
            .filter(
                a ->
                    a.isAceptada()
                        && a.getEvaluacion() != null
                        && (a.getEvaluacion().getRecomendacion()
                                == ar.edu.unlp.jyaa.grupo1.modelo.RecomendacionEvaluacion.APROBADO
                            || a.getEvaluacion().getRecomendacion()
                                == ar.edu.unlp.jyaa.grupo1.modelo.RecomendacionEvaluacion
                                    .APROBADO_CON_CORRECCIONES))
            .count();
    long rechazos =
        asignaciones.stream()
            .filter(
                a ->
                    a.isAceptada()
                        && a.getEvaluacion() != null
                        && a.getEvaluacion().getRecomendacion()
                            == ar.edu.unlp.jyaa.grupo1.modelo.RecomendacionEvaluacion.RECHAZADO)
            .count();
    if (aprobaciones >= 2) {
      trabajo.setEstado(EstadoTrabajo.PENDIENTE_APROBACION_COMITE);
      notificarAutor(
          trabajo,
          "Evaluaciones favorables",
          "Tu trabajo \"" + trabajo.getTitulo() + "\" recibió 2 evaluaciones favorables. El comité confirmará el resultado final.");
      notificacionService.enviarPorRol(
          Rol.ORGANIZADOR_CIENTIFICO,
          "Confirmar trabajo tras evaluaciones",
          "El trabajo \"" + trabajo.getTitulo() + "\" tiene 2 aprobaciones de evaluadores.",
          null);
    } else if (rechazos >= 2) {
      trabajo.setEstado(EstadoTrabajo.RECHAZADO);
      notificarAutor(trabajo, "Trabajo rechazado", "Tu trabajo \"" + trabajo.getTitulo() + "\" fue rechazado por los evaluadores.");
    } else if (rechazos >= 1 && aprobaciones < 2) {
      trabajo.setEstado(EstadoTrabajo.RECHAZADO);
      notificarAutor(trabajo, "Trabajo rechazado", "Tu trabajo \"" + trabajo.getTitulo() + "\" no alcanzó las aprobaciones necesarias.");
    }
    trabajoDAO.modificar(trabajo);
  }

  public Trabajo adjuntarDocumento(Long id, InputStream contenido, String filename) {
    Trabajo trabajo = buscar(id);
    try {
      String url =
          documentStorageService.guardar(
              DocumentStorageService.TipoArchivo.TRABAJO, filename, contenido);
      trabajo.setDocumentoUrl(url);
      return trabajoDAO.modificar(trabajo);
    } catch (IOException e) {
      throw new NegocioException("No se pudo guardar el documento: " + e.getMessage());
    }
  }

  public void baja(Long id) {
    Trabajo trabajo = buscar(id);
    documentStorageService.eliminarPorUrl(trabajo.getDocumentoUrl());
    trabajoDAO.baja(id);
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

  private void notificarAutor(Trabajo trabajo, String asunto, String mensaje) {
    if (trabajo.getAutor() != null && trabajo.getAutor().getId() != null) {
      notificacionService.enviar(trabajo.getAutor().getId(), asunto, mensaje);
    }
  }
}
