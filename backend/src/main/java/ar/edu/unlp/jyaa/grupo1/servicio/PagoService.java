package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.InscripcionCongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.PagoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.PagoFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import ar.edu.unlp.jyaa.grupo1.modelo.Pago;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaPagosDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequestScoped
public class PagoService {

  private static final int PAGE_DEFAULT = 1;
  private static final int SIZE_DEFAULT = 20;
  private static final int SIZE_MAX = 100;

  @Inject private PagoDAO pagoDAO;
  @Inject private InscripcionCongresoDAO inscripcionDAO;
  @Inject private InscripcionService inscripcionService;
  @Inject private UsuarioDAO usuarioDAO;
  @Inject private DocumentStorageService documentStorageService;
  @Inject private NotificacionService notificacionService;

  public Pago registrarPago(Long usuarioId, Pago pago) {
    Usuario usuario = usuarioDAO.recuperarPorId(usuarioId);
    if (usuario == null) {
      throw new NegocioException("Usuario no encontrado");
    }

    InscripcionCongreso inscripcion = inscripcionService.buscarUltimaPorUsuario(usuarioId);
    if (inscripcion == null) {
      throw new NegocioException("Debe completar la inscripción antes de registrar el pago");
    }
    if (!inscripcionService.puedeRegistrarPago(inscripcion)) {
      throw new NegocioException(
          "No puede registrar un pago con la inscripción actual. Verifique su estado.");
    }

    pago.setEstado(EstadoPago.PENDIENTE);
    pago.setFechaRegistro(LocalDate.now());
    pago.setRequiereFactura(inscripcion.isRequiereFactura());
    pagoDAO.alta(pago);

    inscripcion.setPago(pago);
    inscripcionDAO.modificar(inscripcion);
    return pago;
  }

  public Pago consultarPorId(Long id) {
    Pago pago = pagoDAO.recuperarPorId(id);
    if (pago == null) {
      throw new NegocioException("Pago no encontrado: " + id);
    }
    return pago;
  }

  /** Consulta el estado del pago asociado a la inscripción del participante. */
  public Pago consultarEstadoPorUsuario(Long usuarioId) {
    if (usuarioDAO.recuperarPorId(usuarioId) == null) {
      throw new NegocioException("Usuario no encontrado: " + usuarioId);
    }
    return inscripcionDAO
        .buscarUltimaPorUsuario(usuarioId)
        .map(InscripcionCongreso::getPago)
        .orElseThrow(() -> new NegocioException("El usuario no tiene pagos registrados"));
  }

  public Pago adjuntarComprobante(Long id, InputStream contenido, String filename) {
    Pago pago = consultarPorId(id);
    try {
      String url =
          documentStorageService.guardar(
              DocumentStorageService.TipoArchivo.COMPROBANTE, filename, contenido);
      pago.setComprobanteUrl(url);
      return pagoDAO.modificar(pago);
    } catch (IOException e) {
      throw new NegocioException("No se pudo guardar el comprobante: " + e.getMessage());
    }
  }

  public PaginaPagosDTO listarPendientes(
      int page, int size, PagoFiltro filtro, AuthenticatedUser auth) {
    PagoFiltro scoped = aplicarAlcance(filtro, auth);
    PagoFiltro conEstado =
        new PagoFiltro(EstadoPago.PENDIENTE, scoped.monto(), scoped.motivoRechazo(), scoped.usuarioId());
    return listarFiltrado(page, size, conEstado);
  }

  public PaginaPagosDTO listarPendientes(int page, int size) {
    return listarFiltrado(page, size, new PagoFiltro(EstadoPago.PENDIENTE, null, null, null));
  }

  public PaginaPagosDTO listar(int page, int size, PagoFiltro filtro, AuthenticatedUser auth) {
    return listarFiltrado(page, size, aplicarAlcance(filtro, auth));
  }

  public PaginaPagosDTO listar(int page, int size) {
    return listarFiltrado(page, size, new PagoFiltro(null, null, null, null));
  }

  public static PagoFiltro parseFiltro(
      String estado, Double monto, String motivoRechazo, Long usuarioId) {
    EstadoPago estadoEnum = null;
    if (estado != null && !estado.isBlank()) {
      try {
        estadoEnum = EstadoPago.valueOf(estado.trim().toUpperCase());
      } catch (IllegalArgumentException e) {
        throw new NegocioException("Estado de pago inválido: " + estado);
      }
    }
    return new PagoFiltro(estadoEnum, monto, motivoRechazo, usuarioId);
  }

  private PagoFiltro aplicarAlcance(PagoFiltro filtro, AuthenticatedUser auth) {
    PagoFiltro base = filtro != null ? filtro : new PagoFiltro(null, null, null, null);
    if (auth.canListAllPagos()) {
      return base;
    }
    return new PagoFiltro(base.estado(), base.monto(), base.motivoRechazo(), auth.userId());
  }

  private PaginaPagosDTO listarFiltrado(int page, int size, PagoFiltro filtro) {
    int safePage = Math.max(PAGE_DEFAULT, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;

    long total = pagoDAO.contarFiltrado(filtro);
    List<Pago> items = pagoDAO.listarFiltrado(filtro, offset, safeSize);
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);

    return new PaginaPagosDTO(items, safePage, safeSize, total, totalPages);
  }

  public void baja(Long id) {
    Pago pago = consultarPorId(id);
    documentStorageService.eliminarPorUrl(pago.getComprobanteUrl());
    for (InscripcionCongreso inscripcion : inscripcionDAO.listarPorPago(id)) {
      inscripcion.setPago(null);
      inscripcionDAO.modificar(inscripcion);
    }
    pagoDAO.baja(id);
  }

  public ValidacionPagoResult validarPago(
      Long id, boolean aprobar, String motivoRechazo, Double montoAjustado) {
    Pago pago = pagoDAO.recuperarPorId(id);
    if (pago == null) {
      return null;
    }
    if (!aprobar) {
      if (motivoRechazo == null || motivoRechazo.isBlank()) {
        throw new NegocioException("Debe indicar el motivo de rechazo");
      }
      pago.setEstado(EstadoPago.RECHAZADO);
      pago.setMotivoRechazo(motivoRechazo);
      pagoDAO.modificar(pago);
      notificarPago(usuarioIdFromPago(pago), false, motivoRechazo);
      return new ValidacionPagoResult(pago, "Pago rechazado");
    }

    String mensaje = "Pago aprobado";
    if (montoAjustado != null && montoAjustado != pago.getMonto()) {
      double diferencia = montoAjustado - pago.getMonto();
      pago.setMonto(montoAjustado);
      mensaje = "Pago aprobado con ajuste de monto (diferencia: " + diferencia + ")";
    }
    pago.setEstado(EstadoPago.APROBADO);
    pago.setMotivoRechazo(null);
    pagoDAO.modificar(pago);
    inscripcionService.confirmarCongresoPorPagoAprobado(pago.getId());
    notificarPago(usuarioIdFromPago(pago), true, null);
    return new ValidacionPagoResult(pago, mensaje);
  }

  private Long usuarioIdFromPago(Pago pago) {
    return inscripcionDAO.listarPorPago(pago.getId()).stream()
        .findFirst()
        .map(i -> i.getUsuario().getId())
        .orElse(null);
  }

  private void notificarPago(Long usuarioId, boolean aprobado, String motivo) {
    if (usuarioId == null) {
      return;
    }
    if (aprobado) {
      notificacionService.enviarConPlantilla(
          usuarioId, "INSCRIPCION_APROBADA_USUARIO", Map.of("enlace", "/asistente"));
    } else {
      Map<String, String> vars = new HashMap<>();
      vars.put("motivo", motivo != null && !motivo.isBlank() ? motivo : "Sin motivo indicado");
      vars.put("enlace", "/inscripcion");
      notificacionService.enviarConPlantilla(usuarioId, "INSCRIPCION_RECHAZADA_USUARIO", vars);
    }
  }

  public record ValidacionPagoResult(Pago pago, String mensaje) {}
}
