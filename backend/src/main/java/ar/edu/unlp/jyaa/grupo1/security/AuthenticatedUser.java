package ar.edu.unlp.jyaa.grupo1.security;

import ar.edu.unlp.jyaa.grupo1.servicio.NegocioException;
import jakarta.ws.rs.container.ContainerRequestContext;
import java.util.List;

/**
 * Usuario autenticado extraído del JWT.
 *
 * <p>Este record NO parsea el token directamente. En su lugar lee propiedades del request
 * ({@link ContainerRequestContext}) que fueron seteadas por {@code JwtAuthFilter}.
 *
 * <p>Cadena completa:
 *
 * <pre>
 * Frontend → Authorization: Bearer &lt;jwt&gt;
 * Backend  → JwtAuthFilter valida token y setea jwtSubject/jwtRoles
 * Resource → AuthenticatedUser.from(ctx) construye (userId, roles)
 * Service  → aplica reglas de negocio según roles/userId
 * </pre>
 */
public record AuthenticatedUser(Long userId, List<String> roles) {

  public static AuthenticatedUser from(ContainerRequestContext ctx) {
    // jwtSubject = claim "sub" del token (en este proyecto es el ID del usuario).
    Object subject = ctx.getProperty("jwtSubject");
    if (subject == null) {
      throw new NegocioException("No autenticado");
    }
    @SuppressWarnings("unchecked")
    // jwtRoles = claim "roles" del token.
    List<String> roles = (List<String>) ctx.getProperty("jwtRoles");
    return new AuthenticatedUser(
        Long.parseLong(subject.toString()),
        roles != null ? roles : List.of());
  }

  public boolean hasRole(String role) {
    return roles.contains(role);
  }

  public boolean isAdmin() {
    return hasRole("ADMINISTRADOR");
  }

  public boolean canListAllUsuarios() {
    return isAdmin() || hasRole("ORGANIZADOR_CIENTIFICO");
  }

  public boolean canGestionarEvaluadoresEje() {
    return isAdmin() || hasRole("ORGANIZADOR_CIENTIFICO");
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
