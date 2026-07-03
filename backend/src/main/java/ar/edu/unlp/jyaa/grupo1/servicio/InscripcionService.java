package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.InscripcionCongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.PagoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.InscripcionFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.CategoriaInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import ar.edu.unlp.jyaa.grupo1.modelo.MetodoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.Pago;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.web.dto.EstadoInscripcionParticipanteDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.InscripcionCongresoDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaInscripcionesDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.List;

@RequestScoped
public class InscripcionService {

  private static final int PAGE_DEFAULT = 1;
  private static final int SIZE_DEFAULT = 20;
  private static final int SIZE_MAX = 100;

  @Inject private InscripcionCongresoDAO inscripcionDAO;
  @Inject private PagoDAO pagoDAO;
  @Inject private UsuarioDAO usuarioDAO;
  @Inject private DocumentStorageService documentStorageService;
  @Inject private UsuarioService usuarioService;

  public InscripcionCongresoDTO crear(
      AuthenticatedUser auth,
      String categoriaRaw,
      String institucion,
      String provincia,
      boolean requiereFactura,
      String metodoPagoRaw,
      Double monto,
      InputStream certificado,
      String certificadoNombre,
      InputStream comprobante,
      String comprobanteNombre) {
    Usuario usuario = usuarioDAO.recuperarPorId(auth.userId());
    if (usuario == null) {
      throw new NegocioException("Usuario no encontrado");
    }

    String categoriaEfectiva =
        categoriaRaw != null && !categoriaRaw.isBlank()
            ? categoriaRaw
            : usuario.getCategoriaInscripcion();
    if (categoriaEfectiva == null || categoriaEfectiva.isBlank()) {
      throw new NegocioException("Debe indicar la categoría de inscripción");
    }

    CategoriaInscripcion categoria = parseCategoria(categoriaEfectiva);
    MetodoPago metodoPago = parseMetodoPago(metodoPagoRaw);
    validarDatos(categoria, institucion, provincia, requiereFactura, certificado, metodoPago, monto, comprobante);

    inscripcionDAO
        .buscarUltimaPorUsuario(auth.userId())
        .ifPresent(
            existente -> {
              if (existente.getEstado() != EstadoInscripcion.RECHAZADA) {
                throw new NegocioException(
                    "Ya tiene una inscripción "
                        + existente.getEstado().name().toLowerCase()
                        + ". Solo puede crear una nueva si fue rechazada.");
              }
            });

    InscripcionCongreso inscripcion = new InscripcionCongreso();
    inscripcion.setUsuario(usuario);
    inscripcion.setCategoria(categoria.name());
    inscripcion.setInstitucion(institucion.trim());
    inscripcion.setProvincia(provincia.trim());
    inscripcion.setRequiereFactura(requiereFactura);
    inscripcion.setEstado(EstadoInscripcion.PENDIENTE);
    inscripcion.setFechaSolicitud(LocalDate.now());

    if (certificado != null) {
      try {
        String url =
            documentStorageService.guardar(
                DocumentStorageService.TipoArchivo.CERTIFICADO_INSCRIPCION,
                certificadoNombre,
                certificado);
        inscripcion.setCertificadoUrl(url);
      } catch (IOException e) {
        throw new NegocioException("No se pudo guardar el certificado: " + e.getMessage());
      }
    }

    Pago pago = new Pago();
    pago.setMonto(monto);
    pago.setMetodo(metodoPago);
    pago.setRequiereFactura(requiereFactura);
    pago.setEstado(EstadoPago.PENDIENTE);
    pago.setFechaRegistro(LocalDate.now());

    if (comprobante != null && metodoPago == MetodoPago.TRANSFERENCIA) {
      try {
        String url =
            documentStorageService.guardar(
                DocumentStorageService.TipoArchivo.COMPROBANTE, comprobanteNombre, comprobante);
        pago.setComprobanteUrl(url);
      } catch (IOException e) {
        throw new NegocioException("No se pudo guardar el comprobante: " + e.getMessage());
      }
    }

    pagoDAO.alta(pago);
    inscripcion.setPago(pago);
    InscripcionCongreso creada = inscripcionDAO.alta(inscripcion);

    if (!categoria.name().equals(usuario.getCategoriaInscripcion())) {
      usuario.setCategoriaInscripcion(categoria.name());
      usuarioDAO.modificar(usuario);
    }

    return InscripcionCongresoDTO.from(recuperarConRelaciones(creada.getId()));
  }

  public EstadoInscripcionParticipanteDTO estadoParticipante(AuthenticatedUser auth) {
    Usuario usuario = usuarioDAO.recuperarPorId(auth.userId());
    if (usuario == null) {
      throw new NegocioException("Usuario no encontrado");
    }
    InscripcionCongreso inscripcion =
        inscripcionDAO.buscarUltimaPorUsuario(auth.userId()).orElse(null);
    return EstadoInscripcionParticipanteDTO.of(inscripcion, usuario.getCategoriaInscripcion());
  }

  public PaginaInscripcionesDTO listar(
      int page, int size, InscripcionFiltro filtro, AuthenticatedUser auth) {
    if (!auth.canValidarInscripciones()) {
      throw new NegocioException("No tiene permiso para listar inscripciones");
    }
    return listarFiltrado(page, size, filtro != null ? filtro : new InscripcionFiltro(null, null, null));
  }

  public InscripcionCongresoDTO validar(
      Long id, boolean aprobar, String motivoRechazo, AuthenticatedUser auth) {
    if (!auth.canValidarInscripciones()) {
      throw new NegocioException("No tiene permiso para validar inscripciones");
    }
    InscripcionCongreso inscripcion = recuperarConRelaciones(id);
    if (inscripcion == null) {
      return null;
    }
    if (inscripcion.getEstado() != EstadoInscripcion.PENDIENTE) {
      throw new NegocioException("La inscripción ya fue procesada");
    }

    if (!aprobar) {
      if (motivoRechazo == null || motivoRechazo.isBlank()) {
        throw new NegocioException("Debe indicar el motivo de rechazo");
      }
      inscripcion.setEstado(EstadoInscripcion.RECHAZADA);
      inscripcion.setMotivoRechazo(motivoRechazo.trim());
    } else {
      inscripcion.setEstado(EstadoInscripcion.APROBADA);
      inscripcion.setMotivoRechazo(null);
      if (inscripcion.getPago() != null
          && inscripcion.getPago().getEstado() == EstadoPago.PENDIENTE) {
        inscripcion.getPago().setEstado(EstadoPago.APROBADO);
        pagoDAO.modificar(inscripcion.getPago());
      }
      usuarioService.promoverAsistente(inscripcion.getUsuario());
    }

    inscripcionDAO.modificar(inscripcion);
    return InscripcionCongresoDTO.from(recuperarConRelaciones(id));
  }

  public static InscripcionFiltro parseFiltro(String estado, String categoria) {
    EstadoInscripcion estadoEnum = null;
    if (estado != null && !estado.isBlank()) {
      try {
        estadoEnum = EstadoInscripcion.valueOf(estado.trim().toUpperCase());
      } catch (IllegalArgumentException e) {
        throw new NegocioException("Estado de inscripción inválido: " + estado);
      }
    }
    String categoriaNormalizada = null;
    if (categoria != null && !categoria.isBlank()) {
      categoriaNormalizada = parseCategoria(categoria).name();
    }
    return new InscripcionFiltro(estadoEnum, categoriaNormalizada, null);
  }

  private PaginaInscripcionesDTO listarFiltrado(int page, int size, InscripcionFiltro filtro) {
    int safePage = Math.max(PAGE_DEFAULT, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;

    long total = inscripcionDAO.contarFiltrado(filtro);
    List<InscripcionCongresoDTO> items =
        inscripcionDAO.listarFiltrado(filtro, offset, safeSize).stream()
            .map(InscripcionCongresoDTO::from)
            .toList();
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);
    return new PaginaInscripcionesDTO(items, safePage, safeSize, total, totalPages);
  }

  private InscripcionCongreso recuperarConRelaciones(Long id) {
    InscripcionCongreso inscripcion = inscripcionDAO.recuperarPorId(id);
    if (inscripcion == null) {
      return null;
    }
    inscripcion.getUsuario().getNombre();
    if (inscripcion.getPago() != null) {
      inscripcion.getPago().getEstado();
    }
    return inscripcion;
  }

  private static CategoriaInscripcion parseCategoria(String value) {
    try {
      return CategoriaInscripcion.parse(value);
    } catch (IllegalArgumentException e) {
      throw new NegocioException("Categoría de inscripción inválida: " + value);
    }
  }

  private static MetodoPago parseMetodoPago(String value) {
    if (value == null || value.isBlank()) {
      throw new NegocioException("Debe indicar la forma de pago");
    }
    String normalizado = value.trim().toUpperCase();
    if ("TRANSFER".equals(normalizado) || "TRANSFERENCIA".equals(normalizado)) {
      return MetodoPago.TRANSFERENCIA;
    }
    if ("CASH".equals(normalizado) || "EFECTIVO".equals(normalizado)) {
      return MetodoPago.EFECTIVO;
    }
    try {
      return MetodoPago.valueOf(normalizado);
    } catch (IllegalArgumentException e) {
      throw new NegocioException("Forma de pago inválida: " + value);
    }
  }

  private static void validarDatos(
      CategoriaInscripcion categoria,
      String institucion,
      String provincia,
      boolean requiereFactura,
      InputStream certificado,
      MetodoPago metodoPago,
      Double monto,
      InputStream comprobante) {
    if (institucion == null || institucion.isBlank()) {
      throw new NegocioException("Debe indicar la institución");
    }
    if (provincia == null || provincia.isBlank()) {
      throw new NegocioException("Debe indicar la provincia");
    }
    if (requiereFactura && (institucion.isBlank() || provincia.isBlank())) {
      throw new NegocioException("Para factura debe completar institución y provincia");
    }
    if (categoria.requiereCertificado() && certificado == null) {
      throw new NegocioException("La categoría " + categoria.name() + " requiere adjuntar certificado");
    }
    if (monto == null || monto <= 0) {
      throw new NegocioException("Debe indicar un monto válido");
    }
    if (metodoPago == MetodoPago.TRANSFERENCIA && comprobante == null) {
      throw new NegocioException("Debe adjuntar comprobante de transferencia");
    }
  }

  public InscripcionCongreso buscarUltimaPorUsuario(Long usuarioId) {
    return inscripcionDAO.buscarUltimaPorUsuario(usuarioId).orElse(null);
  }

  public boolean puedeRegistrarPago(InscripcionCongreso inscripcion) {
    if (inscripcion == null) {
      return false;
    }
    if (inscripcion.getEstado() == EstadoInscripcion.RECHAZADA) {
      return false;
    }
    if (inscripcion.getPago() == null) {
      return true;
    }
    return inscripcion.getPago().getEstado() == EstadoPago.RECHAZADO;
  }
}
