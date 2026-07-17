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
import ar.edu.unlp.jyaa.grupo1.web.dto.ArqueoCajaDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.ArqueoCajaItemDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaPagosDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.ProximoReciboDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
      Long id,
      boolean aprobar,
      String motivoRechazo,
      Double montoAjustado,
      String numeroRecibo,
      String observaciones,
      Boolean efectivoFisicoRecibido,
      AuthenticatedUser auth) {
    if (auth == null || !auth.isAdmin()) {
      throw new NegocioException("Solo administradores pueden validar pagos");
    }
    Pago pago = pagoDAO.recuperarPorId(id);
    if (pago == null) {
      return null;
    }
    if (pago.getEstado() != EstadoPago.PENDIENTE) {
      throw new NegocioException("El pago ya fue procesado");
    }
    if (!aprobar) {
      if (motivoRechazo == null || motivoRechazo.isBlank()) {
        throw new NegocioException("Debe indicar el motivo de rechazo");
      }
      pago.setEstado(EstadoPago.RECHAZADO);
      pago.setMotivoRechazo(motivoRechazo);
      pagoDAO.modificar(pago);
      notificarPago(usuarioIdFromPago(pago), false, motivoRechazo, null);
      return new ValidacionPagoResult(pago, "Pago rechazado");
    }

    Usuario admin = usuarioDAO.recuperarPorId(auth.userId());
    if (admin == null) {
      throw new NegocioException("Administrador no encontrado");
    }
    boolean fisico = Boolean.TRUE.equals(efectivoFisicoRecibido);
    exigirEfectivoFisicoSiCorresponde(pago, fisico);

    // Efectivo: el recibo lo asigna el sistema en esta transacción (no el del cliente).
    String reciboAsignado = numeroRecibo;
    if (pago.getMetodo() == ar.edu.unlp.jyaa.grupo1.modelo.MetodoPago.EFECTIVO) {
      reciboAsignado = generarProximoNumeroRecibo();
    }

    String mensaje = "Pago aprobado";
    if (montoAjustado != null && montoAjustado != pago.getMonto()) {
      double diferencia = montoAjustado - pago.getMonto();
      pago.setMonto(montoAjustado);
      mensaje = "Pago aprobado con ajuste de monto (diferencia: " + diferencia + ")";
    }
    pago.marcarAprobadoConAuditoria(admin, reciboAsignado, observaciones, fisico);
    pagoDAO.modificar(pago);
    // Fuerza carga del admin antes de serializar la respuesta JSON.
    pago.getValidadoPorNombre();
    inscripcionService.confirmarCongresoPorPagoAprobado(pago.getId());
    notificarPago(usuarioIdFromPago(pago), true, null, pago.getNumeroRecibo());
    if (pago.getMetodo() == ar.edu.unlp.jyaa.grupo1.modelo.MetodoPago.EFECTIVO
        && pago.getNumeroRecibo() != null) {
      mensaje = "Pago en efectivo registrado. Recibo: " + pago.getNumeroRecibo();
    }
    return new ValidacionPagoResult(pago, mensaje);
  }

  /** Preview sin consumir correlativo (para el modal de admin). */
  public ProximoReciboDTO previewProximoRecibo(AuthenticatedUser auth) {
    if (auth == null || !auth.isAdmin()) {
      throw new NegocioException("Solo administradores");
    }
    int anio = LocalDate.now().getYear();
    int siguiente = siguienteCorrelativo(anio);
    return new ProximoReciboDTO(formatearRecibo(anio, siguiente), anio, siguiente);
  }

  /** Asigna el próximo REC-AAAA-NNNNN en la transacción de aprobación. */
  public String generarProximoNumeroRecibo() {
    int anio = LocalDate.now().getYear();
    return formatearRecibo(anio, siguienteCorrelativo(anio));
  }

  private int siguienteCorrelativo(int anio) {
    String prefijo = "REC-" + anio + "-";
    return pagoDAO
        .buscarUltimoNumeroReciboConPrefijo(prefijo)
        .map(ultimo -> parseCorrelativo(ultimo, prefijo) + 1)
        .orElse(1);
  }

  private static int parseCorrelativo(String numeroRecibo, String prefijo) {
    if (numeroRecibo == null || !numeroRecibo.startsWith(prefijo)) {
      return 0;
    }
    String cola = numeroRecibo.substring(prefijo.length()).trim();
    try {
      return Integer.parseInt(cola);
    } catch (NumberFormatException e) {
      return 0;
    }
  }

  private static String formatearRecibo(int anio, int correlativo) {
    return String.format("REC-%d-%05d", anio, Math.max(1, correlativo));
  }

  public ArqueoCajaDTO arqueoCaja(LocalDate desde, LocalDate hasta, AuthenticatedUser auth) {
    if (auth == null || !auth.isAdmin()) {
      throw new NegocioException("Solo administradores pueden consultar el arqueo de caja");
    }
    if (desde == null || hasta == null) {
      throw new NegocioException("Indicá el rango de fechas (desde / hasta)");
    }
    if (hasta.isBefore(desde)) {
      throw new NegocioException("La fecha hasta no puede ser anterior a desde");
    }
    LocalDateTime desdeDt = desde.atStartOfDay();
    LocalDateTime hastaExcl = hasta.plusDays(1).atStartOfDay();
    List<Pago> pagos = pagoDAO.listarArqueoEfectivo(desdeDt, hastaExcl);
    List<ArqueoCajaItemDTO> items = new ArrayList<>();
    double total = 0;
    for (Pago p : pagos) {
      total += p.getMonto();
      items.add(
          new ArqueoCajaItemDTO(
              p.getId(),
              p.getMonto(),
              p.getNumeroRecibo(),
              p.getFechaValidacion(),
              p.getValidadoPorNombre(),
              p.isEfectivoFisicoRecibido(),
              p.getObservacionesValidacion()));
    }
    return new ArqueoCajaDTO(desde, hasta, items.size(), total, items);
  }

  /** Usado también al aprobar inscripción con pago efectivo pendiente. */
  public static void exigirEfectivoFisicoSiCorresponde(Pago pago, boolean efectivoFisicoRecibido) {
    if (pago != null
        && pago.getMetodo() == ar.edu.unlp.jyaa.grupo1.modelo.MetodoPago.EFECTIVO
        && !efectivoFisicoRecibido) {
      throw new NegocioException(
          "Debés confirmar la recepción del efectivo físico antes de aprobar");
    }
  }

  private Long usuarioIdFromPago(Pago pago) {
    return inscripcionDAO.listarPorPago(pago.getId()).stream()
        .findFirst()
        .map(i -> i.getUsuario().getId())
        .orElse(null);
  }

  private void notificarPago(Long usuarioId, boolean aprobado, String motivo, String numeroRecibo) {
    if (usuarioId == null) {
      return;
    }
    if (aprobado) {
      Map<String, String> vars = new HashMap<>();
      vars.put("enlace", "/asistente");
      if (numeroRecibo != null && !numeroRecibo.isBlank()) {
        vars.put(
            "contexto",
            "Tu pago en efectivo quedó registrado con recibo N° " + numeroRecibo.trim() + ".");
      } else {
        vars.put("contexto", "");
      }
      notificacionService.enviarConPlantilla(usuarioId, "INSCRIPCION_APROBADA_USUARIO", vars);
    } else {
      Map<String, String> vars = new HashMap<>();
      vars.put("motivo", motivo != null && !motivo.isBlank() ? motivo : "Sin motivo indicado");
      vars.put("enlace", "/inscripcion");
      notificacionService.enviarConPlantilla(usuarioId, "INSCRIPCION_RECHAZADA_USUARIO", vars);
    }
  }

  public record ValidacionPagoResult(Pago pago, String mensaje) {}
}
