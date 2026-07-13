package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.CongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.InscripcionCongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.PagoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.InscripcionFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.CategoriaInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.Congreso;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import ar.edu.unlp.jyaa.grupo1.modelo.MetodoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequestScoped
public class InscripcionService {

  private static final int PAGE_DEFAULT = 1;
  private static final int SIZE_DEFAULT = 20;
  private static final int SIZE_MAX = 100;

  @Inject private InscripcionCongresoDAO inscripcionDAO;
  @Inject private PagoDAO pagoDAO;
  @Inject private UsuarioDAO usuarioDAO;
  @Inject private CongresoDAO congresoDAO;
  @Inject private DocumentStorageService documentStorageService;
  @Inject private UsuarioService usuarioService;
  @Inject private NotificacionService notificacionService;

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
    validarVentanaInscripcion();

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

    notificarAdminInscripcionPendiente(usuario, categoria, monto, metodoPago);
    notificarUsuarioInscripcionRecibida(usuario, categoria, monto, metodoPago);

    return InscripcionCongresoDTO.from(recuperarConRelaciones(creada.getId()));
  }

  private void notificarAdminInscripcionPendiente(
      Usuario solicitante, CategoriaInscripcion categoria, Double monto, MetodoPago metodoPago) {
    Map<String, String> vars = new HashMap<>();
    vars.put(
        "nombre_solicitante",
        (solicitante.getNombre() + " " + solicitante.getApellido()).trim());
    vars.put("email_solicitante", solicitante.getEmail() != null ? solicitante.getEmail() : "");
    vars.put("categoria", etiquetaCategoria(categoria));
    vars.put("monto", monto != null ? String.format("%.0f", monto) : "0");
    vars.put("metodo_pago", etiquetaMetodoPago(metodoPago));
    vars.put("enlace", "/admin/inscripciones");
    notificacionService.enviarPorRolConPlantilla(
        Rol.ADMINISTRADOR, "INSCRIPCION_PENDIENTE_ADMIN", vars, null);
  }

  private void notificarUsuarioInscripcionRecibida(
      Usuario solicitante, CategoriaInscripcion categoria, Double monto, MetodoPago metodoPago) {
    if (solicitante.getId() == null) {
      return;
    }
    Map<String, String> vars = new HashMap<>();
    vars.put("categoria", etiquetaCategoria(categoria));
    vars.put("monto", monto != null ? String.format("%.0f", monto) : "0");
    vars.put("metodo_pago", etiquetaMetodoPago(metodoPago));
    vars.put("enlace", "/inscripcion");
    notificacionService.enviarConPlantilla(
        solicitante.getId(), "INSCRIPCION_RECIBIDA_USUARIO", vars);
  }

  private void validarVentanaInscripcion() {
    Congreso congreso = congresoDAO.obtenerPrincipal();
    LocalDate hoy = LocalDate.now();
    LocalDate desde = congreso.getInscripcionesDesde();
    LocalDate hasta = congreso.getInscripcionesHasta();
    if (desde != null && hoy.isBefore(desde)) {
      throw new NegocioException(
          "Las inscripciones abren el " + desde + ". Todavía no está habilitada la inscripción.");
    }
    if (hasta != null && hoy.isAfter(hasta)) {
      throw new NegocioException(
          "El período de inscripción cerró el " + hasta + ". Ya no se aceptan nuevas solicitudes.");
    }
  }

  private static String etiquetaCategoria(CategoriaInscripcion categoria) {
    return switch (categoria) {
      case SOCIO_SAAE -> "Socio/a SAAE";
      case NO_SOCIO -> "No socio";
      case ESTUDIANTE -> "Estudiante";
      case PRODUCTOR -> "Productor";
      case INVESTIGADOR -> "Investigador";
      case EXTENSIONISTA -> "Extensionista";
      case DOCENTE -> "Docente";
      case EXTRANJERO -> "Extranjero";
    };
  }

  private static String etiquetaMetodoPago(MetodoPago metodoPago) {
    return switch (metodoPago) {
      case EFECTIVO -> "Efectivo / presencial";
      case TRANSFERENCIA -> "Transferencia bancaria";
      case TARJETA -> "Tarjeta";
    };
  }

  public EstadoInscripcionParticipanteDTO estadoParticipante(AuthenticatedUser auth) {
    sincronizarCongresoAprobado(auth.userId());
    Usuario usuario = usuarioDAO.recuperarPorId(auth.userId());
    if (usuario == null) {
      throw new NegocioException("Usuario no encontrado");
    }
    InscripcionCongreso inscripcion =
        inscripcionDAO.buscarUltimaPorUsuario(auth.userId()).orElse(null);
    boolean esAsistente =
        usuario.getRoles() != null && usuario.getRoles().contains(Rol.ASISTENTE);
    return EstadoInscripcionParticipanteDTO.of(
        inscripcion, usuario.getCategoriaInscripcion(), esAsistente);
  }

  /**
   * Si el pago del congreso está aprobado, confirma la inscripción y asigna rol ASISTENTE.
   * Se invoca al consultar estado y tras validar pagos en administración.
   */
  public void sincronizarCongresoAprobado(Long usuarioId) {
    if (usuarioId == null) {
      return;
    }
    InscripcionCongreso inscripcion =
        inscripcionDAO.buscarUltimaPorUsuario(usuarioId).orElse(null);
    if (inscripcion == null || inscripcion.getPago() == null) {
      return;
    }
    if (inscripcion.getPago().getEstado() != EstadoPago.APROBADO) {
      return;
    }
    if (inscripcion.getEstado() == EstadoInscripcion.PENDIENTE) {
      inscripcion.setEstado(EstadoInscripcion.APROBADA);
      inscripcion.setMotivoRechazo(null);
      inscripcionDAO.modificar(inscripcion);
    }
    if (inscripcion.getEstado() == EstadoInscripcion.APROBADA) {
      usuarioService.promoverAsistente(usuarioId);
    }
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
      inscripcionDAO.modificar(inscripcion);
      notificarUsuarioInscripcionRechazada(inscripcion.getUsuario(), motivoRechazo.trim());
    } else {
      aprobarInscripcion(inscripcion, true);
    }

    return InscripcionCongresoDTO.from(recuperarConRelaciones(id));
  }

  /**
   * Tras aprobar el pago desde administración: aprueba la inscripción vinculada (si pendía) y
   * promueve al usuario a rol ASISTENTE.
   */
  public void confirmarCongresoPorPagoAprobado(Long pagoId) {
    if (pagoId == null) {
      return;
    }
    var inscripciones = inscripcionDAO.listarPorPago(pagoId);
    if (inscripciones.isEmpty()) {
      inscripcionDAO
          .buscarPorPagoId(pagoId)
          .ifPresent(ins -> sincronizarCongresoAprobado(ins.getUsuario().getId()));
      return;
    }
    for (InscripcionCongreso inscripcion : inscripciones) {
      if (inscripcion.getUsuario() != null) {
        sincronizarCongresoAprobado(inscripcion.getUsuario().getId());
      }
    }
  }

  private void aprobarInscripcion(InscripcionCongreso inscripcion, boolean aprobarPagoSiPendiente) {
    inscripcion.setEstado(EstadoInscripcion.APROBADA);
    inscripcion.setMotivoRechazo(null);
    if (aprobarPagoSiPendiente
        && inscripcion.getPago() != null
        && inscripcion.getPago().getEstado() == EstadoPago.PENDIENTE) {
      inscripcion.getPago().setEstado(EstadoPago.APROBADO);
      pagoDAO.modificar(inscripcion.getPago());
    }
    inscripcionDAO.modificar(inscripcion);
    if (inscripcion.getUsuario() != null) {
      usuarioService.promoverAsistente(inscripcion.getUsuario().getId());
      notificarUsuarioInscripcionAprobada(inscripcion.getUsuario());
    }
  }

  private void notificarUsuarioInscripcionAprobada(Usuario usuario) {
    if (usuario == null || usuario.getId() == null) {
      return;
    }
    notificacionService.enviarConPlantilla(
        usuario.getId(), "INSCRIPCION_APROBADA_USUARIO", Map.of("enlace", "/asistente"));
  }

  private void notificarUsuarioInscripcionRechazada(Usuario usuario, String motivo) {
    if (usuario == null || usuario.getId() == null) {
      return;
    }
    Map<String, String> vars = new HashMap<>();
    vars.put("motivo", motivo != null && !motivo.isBlank() ? motivo : "Sin motivo indicado");
    vars.put("enlace", "/inscripcion");
    notificacionService.enviarConPlantilla(
        usuario.getId(), "INSCRIPCION_RECHAZADA_USUARIO", vars);
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
