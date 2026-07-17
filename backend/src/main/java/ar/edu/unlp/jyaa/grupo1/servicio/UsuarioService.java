package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.InscripcionCongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.PagoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.UsuarioFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.CategoriaInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import ar.edu.unlp.jyaa.grupo1.modelo.MetodoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.Pago;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoParticipacionInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.rest.dto.ActualizarPerfilRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.UsuarioAltaRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaUsuariosDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.UsuarioDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.inject.Provider;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RequestScoped
public class UsuarioService {

  private static final int PAGE_DEFAULT = 1;
  private static final int SIZE_DEFAULT = 20;
  private static final int SIZE_MAX = 500;

  @Inject private UsuarioDAO usuarioDAO;
  @Inject private InscripcionCongresoDAO inscripcionDAO;
  @Inject private PagoDAO pagoDAO;
  @Inject private ArancelesService arancelesService;
  @Inject private Provider<PagoService> pagoServiceProvider;
  @Inject private NotificacionService notificacionService;
  @Inject private EvaluadorEjeService evaluadorEjeService;
  @Inject private SolicitudEvaluadorService solicitudEvaluadorService;

  public PaginaUsuariosDTO listar(int page, int size, UsuarioFiltro filtro, AuthenticatedUser auth) {
    if (!auth.canListAllUsuarios()) {
      throw new NegocioException("No tiene permiso para listar usuarios");
    }
    int safePage = Math.max(PAGE_DEFAULT, page);
    int safeSize = Math.min(Math.max(1, size), SIZE_MAX);
    int offset = (safePage - 1) * safeSize;
    UsuarioFiltro effective =
        filtro != null ? filtro : new UsuarioFiltro(null, null, null, null, null, null);

    long total = usuarioDAO.contarFiltrado(effective);
    List<UsuarioDTO> items =
        evaluadorEjeService.toDtos(usuarioDAO.listarFiltrado(effective, offset, safeSize));
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);

    return new PaginaUsuariosDTO(items, safePage, safeSize, total, totalPages);
  }

  public List<Usuario> listarTodos() {
    return usuarioDAO.listarTodos();
  }

  public Usuario buscarPorId(Long id) {
    return usuarioDAO.recuperarPorId(id);
  }

  /**
   * Actualiza datos personales del propio usuario (certificado + categoría). No permite cambiar
   * roles, activo ni eje de evaluador.
   */
  public Usuario actualizarPerfilPropio(Long usuarioId, ActualizarPerfilRequest req) {
    if (req == null) {
      throw new NegocioException("Datos de perfil requeridos");
    }
    Usuario existente = usuarioDAO.recuperarPorId(usuarioId);
    if (existente == null) {
      throw new NegocioException("Usuario no encontrado");
    }

    String nombre = req.nombre() != null ? req.nombre().trim() : "";
    String apellido = req.apellido() != null ? req.apellido().trim() : "";
    String email = req.email() != null ? req.email().trim().toLowerCase() : "";
    if (nombre.isBlank() || apellido.isBlank() || email.isBlank()) {
      throw new NegocioException("Nombre, apellido y email son obligatorios");
    }
    if (!email.contains("@") || email.length() > 180) {
      throw new NegocioException("Email inválido");
    }
    if (nombre.length() > 80 || apellido.length() > 80) {
      throw new NegocioException("Nombre o apellido demasiado largos");
    }

    if (!email.equalsIgnoreCase(existente.getEmail())) {
      var otro = usuarioDAO.buscarPorEmail(email);
      if (otro.isPresent() && !otro.get().getId().equals(usuarioId)) {
        throw new NegocioException("El email ya está registrado");
      }
      existente.setEmail(email);
    }

    existente.setNombre(nombre);
    existente.setApellido(apellido);

    // Datos de certificado: siempre se actualizan desde el perfil (obligatorios en UI).
    validarDatosCertificado(
        req.telefono(),
        req.tipoIdentificacion(),
        req.numeroIdentificacion(),
        req.nacionalidad(),
        true);
    existente.setTelefono(req.telefono() != null ? req.telefono().trim() : null);
    existente.setTipoIdentificacion(
        req.tipoIdentificacion() != null ? req.tipoIdentificacion().trim() : null);
    existente.setNumeroIdentificacion(
        req.numeroIdentificacion() != null ? req.numeroIdentificacion().trim() : null);
    existente.setNacionalidad(req.nacionalidad() != null ? req.nacionalidad().trim() : null);

    String categoriaRaw =
        req.categoriaInscripcion() != null ? req.categoriaInscripcion().trim() : "";
    if (categoriaRaw.isBlank()) {
      throw new NegocioException("Debe indicar la categoría de inscripción");
    }
    try {
      existente.setCategoriaInscripcion(CategoriaInscripcion.parse(categoriaRaw).name());
    } catch (IllegalArgumentException e) {
      throw new NegocioException("Categoría de inscripción inválida: " + categoriaRaw);
    }

    String passwordNueva =
        req.passwordNueva() != null && !req.passwordNueva().isBlank() ? req.passwordNueva() : null;
    if (passwordNueva != null) {
      if (passwordNueva.length() < 8) {
        throw new NegocioException("La nueva contraseña debe tener al menos 8 caracteres");
      }
      String passwordActual = req.passwordActual() != null ? req.passwordActual() : "";
      if (passwordActual.isBlank() || !passwordActual.equals(existente.getPassword())) {
        throw new NegocioException("La contraseña actual es incorrecta");
      }
      existente.setPassword(passwordNueva);
    }

    return usuarioDAO.modificar(existente);
  }

  public Usuario alta(Usuario usuario) {
    return alta(usuario, null, null, null, false, null, null, null, null);
  }

  /**
   * Alta admin. Si el usuario incluye rol {@link Rol#ASISTENTE}, exige datos de certificado +
   * categoría/filiación y deja inscripción + pago en efectivo aprobados (asistente presencial).
   * Staff (sin ASISTENTE) usa el alta corta.
   */
  public Usuario alta(UsuarioAltaRequest request, AuthenticatedUser auth) {
    if (request == null) {
      throw new NegocioException("Datos de alta requeridos");
    }
    Usuario usuario = new Usuario();
    usuario.setNombre(request.nombre);
    usuario.setApellido(request.apellido);
    usuario.setEmail(request.email);
    usuario.setPassword(request.password);
    usuario.setRoles(request.roles != null ? new HashSet<>(request.roles) : new HashSet<>());
    usuario.setRolActual(request.rolActual);
    usuario.setCategoriaInscripcion(request.categoriaInscripcion);
    usuario.setTelefono(request.telefono);
    usuario.setTipoIdentificacion(request.tipoIdentificacion);
    usuario.setNumeroIdentificacion(request.numeroIdentificacion);
    usuario.setNacionalidad(request.nacionalidad);
    return alta(
        usuario,
        auth,
        request.institucion,
        request.provincia,
        Boolean.TRUE.equals(request.requiereFactura),
        request.facturaRazonSocial,
        request.facturaCuit,
        request.facturaCondicionIva,
        request.facturaDomicilioFiscal);
  }

  public Usuario alta(
      Usuario usuario,
      AuthenticatedUser auth,
      String institucion,
      String provincia,
      boolean requiereFactura,
      String facturaRazonSocial,
      String facturaCuit,
      String facturaCondicionIva,
      String facturaDomicilioFiscal) {
    if (usuario.getEmail() != null) {
      usuario.setEmail(usuario.getEmail().trim().toLowerCase());
    }
    if (usuarioDAO.buscarPorEmail(usuario.getEmail()).isPresent()) {
      throw new NegocioException("El email ya está registrado");
    }
    if (usuario.getRoles() == null) {
      usuario.setRoles(new HashSet<>());
    }
    usuario.getRoles().remove(Rol.PARTICIPANTE);
    if (usuario.getRoles().isEmpty()) {
      throw new NegocioException("Debe indicar al menos un rol");
    }

    boolean esAsistente = usuario.getRoles().contains(Rol.ASISTENTE);
    if (esAsistente) {
      if (auth == null || !auth.isAdmin()) {
        throw new NegocioException("Solo un administrador puede dar de alta un asistente presencial");
      }
      if (usuario.getCategoriaInscripcion() == null || usuario.getCategoriaInscripcion().isBlank()) {
        throw new NegocioException("La categoría de inscripción es obligatoria para asistentes");
      }
      validarDatosCertificado(
          usuario.getTelefono(),
          usuario.getTipoIdentificacion(),
          usuario.getNumeroIdentificacion(),
          usuario.getNacionalidad(),
          true);
      normalizarDatosCertificado(usuario);
      if (institucion == null || institucion.isBlank() || provincia == null || provincia.isBlank()) {
        throw new NegocioException(
            "Institución y provincia son obligatorias para el alta de asistente");
      }
      if (requiereFactura) {
        if (facturaRazonSocial == null || facturaRazonSocial.isBlank()) {
          throw new NegocioException("Para factura indicá la razón social");
        }
        if (facturaCuit == null || facturaCuit.isBlank()) {
          throw new NegocioException("Para factura indicá CUIT/CUIL");
        }
        if (facturaCondicionIva == null || facturaCondicionIva.isBlank()) {
          throw new NegocioException("Para factura indicá la condición frente al IVA");
        }
        if (facturaDomicilioFiscal == null || facturaDomicilioFiscal.isBlank()) {
          throw new NegocioException("Para factura indicá el domicilio fiscal");
        }
      }
    } else {
      usuario.setTelefono(blankToNull(usuario.getTelefono()));
      usuario.setTipoIdentificacion(blankToNull(usuario.getTipoIdentificacion()));
      usuario.setNumeroIdentificacion(blankToNull(usuario.getNumeroIdentificacion()));
      usuario.setNacionalidad(blankToNull(usuario.getNacionalidad()));
    }

    if (usuario.getCategoriaInscripcion() != null && !usuario.getCategoriaInscripcion().isBlank()) {
      try {
        usuario.setCategoriaInscripcion(
            CategoriaInscripcion.parse(usuario.getCategoriaInscripcion()).name());
      } catch (IllegalArgumentException e) {
        throw new NegocioException(
            "Categoría de inscripción inválida: " + usuario.getCategoriaInscripcion());
      }
    } else {
      usuario.setCategoriaInscripcion(null);
    }

    usuario.setActivo(true);
    normalizarRolActual(usuario, usuario.getRolActual());
    Usuario creado = usuarioDAO.alta(usuario);

    if (esAsistente) {
      String recibo =
          crearInscripcionYPagoAprobados(
              creado,
              auth,
              institucion.trim(),
              provincia.trim(),
              requiereFactura,
              blankToNull(facturaRazonSocial),
              blankToNull(facturaCuit),
              blankToNull(facturaCondicionIva),
              blankToNull(facturaDomicilioFiscal));
      String msg =
          "Te dieron de alta como asistente. Ya podés ingresar con tu email y la contraseña"
              + " asignada. Tu inscripción y pago en efectivo quedaron registrados"
              + (recibo != null ? " con recibo N° " + recibo : "")
              + ". Consultá el detalle en Ver mi inscripción.";
      if (requiereFactura) {
        msg += " Solicitaste factura: te avisaremos cuando esté disponible para descargar.";
      }
      notificacionService.enviar(
          creado.getId(), "Alta como asistente del congreso", msg, "/asistente/inscripcion");
    }
    return creado;
  }

  private String crearInscripcionYPagoAprobados(
      Usuario asistente,
      AuthenticatedUser auth,
      String institucion,
      String provincia,
      boolean requiereFactura,
      String facturaRazonSocial,
      String facturaCuit,
      String facturaCondicionIva,
      String facturaDomicilioFiscal) {
    inscripcionDAO
        .buscarUltimaPorUsuario(asistente.getId())
        .ifPresent(
            existente -> {
              if (existente.getEstado() != EstadoInscripcion.RECHAZADA) {
                throw new NegocioException(
                    "El usuario ya tiene una inscripción "
                        + existente.getEstado().name().toLowerCase());
              }
            });

    CategoriaInscripcion categoria =
        CategoriaInscripcion.parse(asistente.getCategoriaInscripcion());
    double monto = arancelesService.montoOficial(categoria);

    Usuario admin = usuarioDAO.recuperarPorId(auth.userId());
    if (admin == null) {
      throw new NegocioException("Administrador no encontrado");
    }

    PagoService pagoService = pagoServiceProvider.get();
    String recibo = pagoService.generarProximoNumeroRecibo();

    Pago pago = new Pago();
    pago.setMonto(monto);
    pago.setMetodo(MetodoPago.EFECTIVO);
    pago.setRequiereFactura(requiereFactura);
    pago.setFechaRegistro(LocalDate.now());
    pago.marcarAprobadoConAuditoria(
        admin,
        recibo,
        "Alta admin: asistente presencial (inscripción y pago aprobados al crear usuario)",
        true);
    pagoDAO.alta(pago);

    InscripcionCongreso inscripcion = new InscripcionCongreso();
    inscripcion.setUsuario(asistente);
    inscripcion.setCategoria(categoria.name());
    inscripcion.setInstitucion(institucion);
    inscripcion.setProvincia(provincia);
    inscripcion.setRequiereFactura(requiereFactura);
    if (requiereFactura) {
      inscripcion.setFacturaRazonSocial(facturaRazonSocial);
      inscripcion.setFacturaCuit(facturaCuit);
      inscripcion.setFacturaCondicionIva(facturaCondicionIva);
      inscripcion.setFacturaDomicilioFiscal(facturaDomicilioFiscal);
    }
    inscripcion.setTiposParticipacion(List.of(TipoParticipacionInscripcion.ASISTENTE.name()));
    inscripcion.setEstado(EstadoInscripcion.APROBADA);
    inscripcion.setFechaSolicitud(LocalDate.now());
    inscripcion.setPago(pago);
    inscripcionDAO.alta(inscripcion);

    pagoService.notificarAdminsCobroEfectivo(pago, admin, auth.userId());
    return recibo;
  }

  private static String blankToNull(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }

  public Usuario modificar(Long id, Usuario datos) {
    Usuario existente = usuarioDAO.recuperarPorId(id);
    if (existente == null) {
      return null;
    }
    datos.setId(id);
    if (datos.getPassword() == null || datos.getPassword().isBlank()) {
      datos.setPassword(existente.getPassword());
    }
    if (datos.getRoles() == null || datos.getRoles().isEmpty()) {
      datos.setRoles(existente.getRoles());
    }
    normalizarRolActual(datos, datos.getRolActual());
    return usuarioDAO.modificar(datos);
  }

  public void baja(Long id) {
    if (usuarioDAO.recuperarPorId(id) == null) {
      throw new NegocioException("Usuario no encontrado");
    }
    usuarioDAO.baja(id);
  }

  public Usuario asignarRoles(Long id, Set<Rol> roles, Rol rolActual) {
    Usuario usuario = usuarioDAO.recuperarPorId(id);
    if (usuario == null) {
      return null;
    }
    if (roles == null || roles.isEmpty()) {
      throw new NegocioException("Debe indicar al menos un rol");
    }
    boolean teniaEvaluador =
        usuario.getRoles() != null && usuario.getRoles().contains(Rol.EVALUADOR);
    boolean quedaEvaluador = roles.contains(Rol.EVALUADOR);
    usuario.setRoles(new HashSet<>(roles));
    normalizarRolActual(usuario, rolActual);
    Usuario actualizado = usuarioDAO.modificar(usuario);
    if (teniaEvaluador && !quedaEvaluador) {
      evaluadorEjeService.limpiarCuposYEje(id);
      solicitudEvaluadorService.revocarAprobadasPorRetiroDeRol(id);
    }
    return actualizado;
  }

  public Usuario setActivo(Long id, boolean activo) {
    Usuario usuario = usuarioDAO.recuperarPorId(id);
    if (usuario == null) {
      return null;
    }
    usuario.setActivo(activo);
    return usuarioDAO.modificar(usuario);
  }

  public Usuario promoverEvaluador(Long id) {
    Usuario usuario = usuarioDAO.recuperarPorId(id);
    if (usuario == null) {
      return null;
    }
    usuario.getRoles().add(Rol.EVALUADOR);
    return usuarioDAO.modificar(usuario);
  }

  public Usuario promoverAutor(Long id) {
    return promoverAutor(id, false);
  }

  /**
   * Habilita rol AUTOR a un asistente.
   *
   * @param porDictamenComite si es true, el mensaje indica habilitación automática al aprobar el
   *     trabajo (sin intervención del admin).
   */
  public Usuario promoverAutor(Long id, boolean porDictamenComite) {
    Usuario usuario = usuarioDAO.recuperarPorId(id);
    if (usuario == null) {
      return null;
    }
    if (usuario.getRoles().contains(Rol.AUTOR)) {
      if (usuario.getRolActual() == Rol.AUTOR) {
        if (porDictamenComite) {
          return usuario;
        }
        throw new NegocioException("El usuario ya tiene rol autor habilitado");
      }
      usuario.setRolActual(Rol.AUTOR);
      Usuario actualizado = usuarioDAO.modificar(usuario);
      notificarRolAutorHabilitado(actualizado, porDictamenComite);
      return actualizado;
    }
    if (!usuario.getRoles().contains(Rol.ASISTENTE)) {
      throw new NegocioException("Solo asistentes pueden solicitar el rol autor");
    }
    usuario.getRoles().add(Rol.AUTOR);
    if (usuario.getRolActual() == null || usuario.getRolActual() == Rol.ASISTENTE) {
      usuario.setRolActual(Rol.AUTOR);
    }
    Usuario actualizado = usuarioDAO.modificar(usuario);
    notificarRolAutorHabilitado(actualizado, porDictamenComite);
    return actualizado;
  }

  private void notificarRolAutorHabilitado(Usuario usuario, boolean porDictamenComite) {
    String causa =
        porDictamenComite
            ? "Al aprobar tu trabajo, el comité académico te habilitó el rol de autor."
            : "El administrador habilitó tu rol de autor.";
    notificacionService.enviar(
        usuario.getId(),
        "Rol autor habilitado",
        TrabajoNotificacionHelper.formatear(
            causa, "Ya podés gestionar trabajos desde el panel Autor."),
        TrabajoNotificacionHelper.RUTA_AUTOR_TRABAJOS);
  }

  public Usuario registrarParticipante(Usuario usuario) {
    return registrarParticipante(usuario, null);
  }

  public Usuario registrarParticipante(Usuario usuario, String categoriaRaw) {
    if (usuario.getEmail() != null) {
      usuario.setEmail(usuario.getEmail().trim().toLowerCase());
    }
    if (usuarioDAO.buscarPorEmail(usuario.getEmail()).isPresent()) {
      throw new NegocioException("El email ya está registrado");
    }
    if (categoriaRaw != null && !categoriaRaw.isBlank()) {
      try {
        usuario.setCategoriaInscripcion(CategoriaInscripcion.parse(categoriaRaw).name());
      } catch (IllegalArgumentException e) {
        throw new NegocioException("Categoría de inscripción inválida: " + categoriaRaw);
      }
    }
    validarDatosCertificado(
        usuario.getTelefono(),
        usuario.getTipoIdentificacion(),
        usuario.getNumeroIdentificacion(),
        usuario.getNacionalidad(),
        true);
    normalizarDatosCertificado(usuario);
    usuario.setActivo(true);
    usuario.setRoles(new HashSet<>());
    usuario.setRolActual(null);
    return usuarioDAO.alta(usuario);
  }

  private static void validarDatosCertificado(
      String telefono,
      String tipoIdentificacion,
      String numeroIdentificacion,
      String nacionalidad,
      boolean obligatorios) {
    String tel = telefono != null ? telefono.trim() : "";
    String tipo = tipoIdentificacion != null ? tipoIdentificacion.trim() : "";
    String numero = numeroIdentificacion != null ? numeroIdentificacion.trim() : "";
    String nac = nacionalidad != null ? nacionalidad.trim() : "";
    if (!obligatorios && tel.isBlank() && tipo.isBlank() && numero.isBlank() && nac.isBlank()) {
      return;
    }
    if (tel.isBlank() || tipo.isBlank() || numero.isBlank() || nac.isBlank()) {
      throw new NegocioException(
          "Teléfono, tipo y número de identificación y nacionalidad son obligatorios");
    }
    if (tel.length() < 6 || tel.length() > 40) {
      throw new NegocioException("Teléfono inválido (usá formato internacional, ej. +54 9 221...)");
    }
    if (tipo.length() > 40 || numero.length() > 60 || nac.length() > 80) {
      throw new NegocioException("Datos de identificación demasiado largos");
    }
  }

  private static void normalizarDatosCertificado(Usuario usuario) {
    if (usuario.getTelefono() != null) {
      usuario.setTelefono(usuario.getTelefono().trim());
    }
    if (usuario.getTipoIdentificacion() != null) {
      usuario.setTipoIdentificacion(usuario.getTipoIdentificacion().trim());
    }
    if (usuario.getNumeroIdentificacion() != null) {
      usuario.setNumeroIdentificacion(usuario.getNumeroIdentificacion().trim());
    }
    if (usuario.getNacionalidad() != null) {
      usuario.setNacionalidad(usuario.getNacionalidad().trim());
    }
  }

  /** Tras aprobar la inscripción al congreso, habilita el rol operativo de asistente. */
  public void promoverAsistente(Usuario usuario) {
    if (usuario == null || usuario.getId() == null) {
      return;
    }
    promoverAsistente(usuario.getId());
  }

  public void promoverAsistente(Long usuarioId) {
    if (usuarioId == null) {
      return;
    }
    Usuario managed = usuarioDAO.recuperarPorId(usuarioId);
    if (managed == null) {
      return;
    }
    if (managed.getRoles() == null) {
      managed.setRoles(new HashSet<>());
    }
    if (managed.getRoles().contains(Rol.ASISTENTE)) {
      if (managed.getRolActual() == null || managed.getRolActual() == Rol.PARTICIPANTE) {
        managed.setRolActual(Rol.ASISTENTE);
        usuarioDAO.modificar(managed);
        usuarioDAO.flush();
      }
      return;
    }
    managed.getRoles().add(Rol.ASISTENTE);
    managed.getRoles().remove(Rol.PARTICIPANTE);
    if (managed.getRolActual() == null
        || managed.getRolActual() == Rol.PARTICIPANTE
        || !managed.getRoles().contains(managed.getRolActual())) {
      managed.setRolActual(Rol.ASISTENTE);
    }
    usuarioDAO.modificar(managed);
    usuarioDAO.flush();
  }

  /**
   * Tras login: limpia rol legacy PARTICIPANTE y sincroniza ASISTENTE si el pago/inscripción ya
   * fueron aprobados (p. ej. admin validó solo el pago).
   */
  public Usuario normalizarRolesCongreso(Usuario usuario) {
    if (usuario == null || usuario.getId() == null) {
      return usuario;
    }
    boolean modificado = false;
    Set<Rol> roles = usuario.getRoles();
    if (roles != null && roles.remove(Rol.PARTICIPANTE)) {
      if (usuario.getRolActual() == Rol.PARTICIPANTE) {
        usuario.setRolActual(null);
      }
      modificado = true;
    }

    InscripcionCongreso inscripcion =
        inscripcionDAO.buscarUltimaPorUsuario(usuario.getId()).orElse(null);
    if (inscripcion != null) {
      if (inscripcion.getEstado() == EstadoInscripcion.PENDIENTE
          && inscripcion.getPago() != null
          && inscripcion.getPago().getEstado() == EstadoPago.APROBADO) {
        inscripcion.setEstado(EstadoInscripcion.APROBADA);
        inscripcion.setMotivoRechazo(null);
        inscripcionDAO.modificar(inscripcion);
      }
      if (inscripcion.getEstado() == EstadoInscripcion.APROBADA
          && (roles == null || !roles.contains(Rol.ASISTENTE))) {
        promoverAsistente(usuario.getId());
        return usuarioDAO.recuperarPorId(usuario.getId());
      }
    }

    if (modificado) {
      return usuarioDAO.modificar(usuario);
    }
    return usuario;
  }

  /**
   * Asegura que {@code rolActual} apunte a un rol que el usuario tenga asignado. Si se indica
   * {@code preferido} y está en la lista, se usa ese; si no, el primero disponible.
   */
  private void normalizarRolActual(Usuario usuario, Rol preferido) {
    Set<Rol> roles = usuario.getRoles();
    if (roles == null || roles.isEmpty()) {
      return;
    }
    if (preferido != null && roles.contains(preferido)) {
      usuario.setRolActual(preferido);
    } else if (usuario.getRolActual() == null || !roles.contains(usuario.getRolActual())) {
      usuario.setRolActual(roles.iterator().next());
    }
  }
}
