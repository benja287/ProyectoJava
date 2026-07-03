package ar.edu.unlp.jyaa.grupo1.security;

import ar.edu.unlp.jyaa.grupo1.servicio.NegocioException;
import jakarta.ws.rs.container.ContainerRequestContext;
import java.util.List;

/** Usuario autenticado extraído del JWT (propiedades seteadas en JwtAuthFilter). */
public record AuthenticatedUser(Long userId, List<String> roles) {

  public static AuthenticatedUser from(ContainerRequestContext ctx) {
    Object subject = ctx.getProperty("jwtSubject");
    if (subject == null) {
      throw new NegocioException("No autenticado");
    }
    @SuppressWarnings("unchecked")
    List<String> roles = (List<String>) ctx.getProperty("jwtRoles");
    return new AuthenticatedUser(Long.parseLong(subject.toString()), roles != null ? roles : List.of());
  }

  public boolean hasRole(String role) {
    return roles.contains(role);
  }

  public boolean isAdmin() {
    return hasRole("ADMINISTRADOR");
  }

  public boolean canListAllUsuarios() {
    return isAdmin();
  }

  public boolean canListAllTrabajos() {
    return isAdmin() || hasRole("ORGANIZADOR_CIENTIFICO");
  }

  public boolean canListAllPagos() {
    return isAdmin();
  }

  /** Catálogo de actividades visible para cualquier usuario autenticado. */
  public boolean canListActividades() {
    return true;
  }

  public boolean canValidarInscripciones() {
    return isAdmin();
  }
}
