package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.InscripcionCongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.PagoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import ar.edu.unlp.jyaa.grupo1.modelo.Pago;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaPagosDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.List;

@RequestScoped
public class PagoService {

  private static final int PAGE_DEFAULT = 1;
  private static final int SIZE_DEFAULT = 20;
  private static final int SIZE_MAX = 100;

  @Inject private PagoDAO pagoDAO;
  @Inject private InscripcionCongresoDAO inscripcionDAO;
  @Inject private UsuarioDAO usuarioDAO;
  @Inject private DocumentStorageService documentStorageService;

  public Pago registrarPago(Long usuarioId, Pago pago) {
    Usuario usuario = usuarioDAO.recuperarPorId(usuarioId);
    if (usuario == null) {
      throw new NegocioException("Usuario no encontrado");
    }
    pago.setEstado(EstadoPago.PENDIENTE);
    pago.setFechaRegistro(LocalDate.now());
    pagoDAO.alta(pago);

    InscripcionCongreso inscripcion =
        inscripcionDAO.buscarUltimaPorUsuario(usuarioId).orElse(null);
    if (inscripcion == null) {
      inscripcion = new InscripcionCongreso();
      inscripcion.setUsuario(usuario);
      inscripcion.setCategoria("general");
      inscripcion.setEstado(EstadoInscripcion.PENDIENTE);
      inscripcion.setFechaSolicitud(LocalDate.now());
      inscripcion.setPago(pago);
      inscripcionDAO.alta(inscripcion);
    } else {
      inscripcion.setPago(pago);
      inscripcionDAO.modificar(inscripcion);
    }
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

  public PaginaPagosDTO listarPendientes(int page, int size) {
    int safePage = Math.max(PAGE_DEFAULT, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;

    long total = pagoDAO.contarPorEstado(EstadoPago.PENDIENTE);
    List<Pago> items =
        pagoDAO.listarPorEstadoPaginado(EstadoPago.PENDIENTE, offset, safeSize);
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);

    return new PaginaPagosDTO(items, safePage, safeSize, total, totalPages);
  }

  public PaginaPagosDTO listar(int page, int size) {
    int safePage = Math.max(PAGE_DEFAULT, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;

    long total = pagoDAO.contar();
    List<Pago> items = pagoDAO.listarPaginado(offset, safeSize);
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
    return new ValidacionPagoResult(pago, mensaje);
  }

  public record ValidacionPagoResult(Pago pago, String mensaje) {}
}
