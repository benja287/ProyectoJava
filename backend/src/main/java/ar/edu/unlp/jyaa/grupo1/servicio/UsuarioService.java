package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.InscripcionCongresoDAO;
import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.UsuarioFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.CategoriaInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoInscripcion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaUsuariosDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.UsuarioDTO;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
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
  @Inject private NotificacionService notificacionService;

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
        usuarioDAO.listarFiltrado(effective, offset, safeSize).stream().map(UsuarioDTO::from).toList();
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);

    return new PaginaUsuariosDTO(items, safePage, safeSize, total, totalPages);
  }

  public List<Usuario> listarTodos() {
    return usuarioDAO.listarTodos();
  }

  public Usuario buscarPorId(Long id) {
    return usuarioDAO.recuperarPorId(id);
  }

  public Usuario alta(Usuario usuario) {
    if (usuario.getEmail() != null) {
      usuario.setEmail(usuario.getEmail().trim().toLowerCase());
    }
    if (usuarioDAO.buscarPorEmail(usuario.getEmail()).isPresent()) {
      throw new NegocioException("El email ya está registrado");
    }
    if (usuario.getCategoriaInscripcion() != null && !usuario.getCategoriaInscripcion().isBlank()) {
      try {
        usuario.setCategoriaInscripcion(CategoriaInscripcion.parse(usuario.getCategoriaInscripcion()).name());
      } catch (IllegalArgumentException e) {
        throw new NegocioException("Categoría de inscripción inválida: " + usuario.getCategoriaInscripcion());
      }
    } else {
      usuario.setCategoriaInscripcion(null);
    }
    if (usuario.getRoles() == null) {
      usuario.setRoles(new HashSet<>());
    }
    usuario.getRoles().remove(Rol.PARTICIPANTE);
    if (usuario.getRoles().isEmpty()) {
      throw new NegocioException("Debe indicar al menos un rol");
    }
    usuario.setActivo(true);
    normalizarRolActual(usuario, usuario.getRolActual());
    return usuarioDAO.alta(usuario);
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
    usuario.setRoles(new HashSet<>(roles));
    normalizarRolActual(usuario, rolActual);
    return usuarioDAO.modificar(usuario);
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
    usuario.setActivo(true);
    usuario.setRoles(new HashSet<>());
    usuario.setRolActual(null);
    return usuarioDAO.alta(usuario);
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
