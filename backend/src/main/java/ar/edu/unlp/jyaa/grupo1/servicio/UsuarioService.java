package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RequestScoped
public class UsuarioService {

  @Inject private UsuarioDAO usuarioDAO;

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
    if (usuario.getRoles() == null || usuario.getRoles().isEmpty()) {
      usuario.setRoles(new HashSet<>(Set.of(Rol.PARTICIPANTE)));
    }
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

  public Usuario registrarParticipante(Usuario usuario) {
    if (usuario.getEmail() != null) {
      usuario.setEmail(usuario.getEmail().trim().toLowerCase());
    }
    if (usuarioDAO.buscarPorEmail(usuario.getEmail()).isPresent()) {
      throw new NegocioException("El email ya está registrado");
    }
    usuario.setActivo(true);
    usuario.setRoles(new HashSet<>(Set.of(Rol.PARTICIPANTE)));
    normalizarRolActual(usuario, Rol.PARTICIPANTE);
    return usuarioDAO.alta(usuario);
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
