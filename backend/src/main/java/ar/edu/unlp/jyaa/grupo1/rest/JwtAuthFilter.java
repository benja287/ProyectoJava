package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.security.JwtException;
import ar.edu.unlp.jyaa.grupo1.security.JwtService;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.util.List;
import java.util.Map;

/**
 * Valida Authorization: Bearer en rutas protegidas de /api.
 * Tras verificar el JWT, consulta en BD (sin caché) si la cuenta sigue activa y cuáles son
 * los roles actuales — así un alta/baja de rol (p. ej. EVALUADOR) vale al instante sin
 * volver a iniciar sesión.
 */
@Provider
@Priority(Priorities.AUTHENTICATION)
public class JwtAuthFilter implements ContainerRequestFilter {

  @Inject private JwtService jwtService;
  @Inject private UsuarioDAO usuarioDAO;

  @Override
  public void filter(ContainerRequestContext requestContext) {
    String method = requestContext.getMethod();
    if ("OPTIONS".equalsIgnoreCase(method)) {
      return;
    }

    String path = normalizePath(requestContext.getUriInfo().getPath());
    if (isPublicPath(path, method)) {
      return;
    }

    String authorization = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);
    if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
      abortUnauthorized(requestContext, "Token requerido");
      return;
    }

    String token = authorization.substring(7).trim();
    if (token.isEmpty()) {
      abortUnauthorized(requestContext, "Token requerido");
      return;
    }

    try {
      var claims = jwtService.parse(token);

      requestContext.setProperty("jwtSubject", claims.getSubject());
      requestContext.setProperty("jwtEmail", claims.get("email", String.class));

      // Roles desde BD (no desde el claim del token): reflejan cambios en caliente.
      if (!cargarUsuarioActivoYRoles(claims.getSubject(), requestContext)) {
        return;
      }
    } catch (JwtException e) {
      abortUnauthorized(requestContext, e.getMessage());
    }
  }

  /**
   * Carga el usuario, valida activo y publica roles actuales en el request.
   *
   * @return false si ya se abortó la request
   */
  private boolean cargarUsuarioActivoYRoles(String subject, ContainerRequestContext requestContext) {
    Long userId;
    try {
      userId = Long.parseLong(subject);
    } catch (NumberFormatException e) {
      abortUnauthorized(requestContext, "Token inválido");
      return false;
    }

    Usuario usuario = usuarioDAO.recuperarPorId(userId);
    if (usuario == null) {
      abortUnauthorized(requestContext, "Usuario no encontrado");
      return false;
    }
    if (!usuario.isActivo()) {
      abortForbidden(requestContext, "Cuenta deshabilitada");
      return false;
    }

    List<String> roles =
        usuario.getRoles() == null
            ? List.of()
            : usuario.getRoles().stream().map(Rol::name).sorted().toList();
    requestContext.setProperty("jwtRoles", roles);
    return true;
  }

  private static String normalizePath(String path) {
    if (path == null) {
      return "";
    }
    return path.startsWith("/") ? path.substring(1) : path;
  }

  private static boolean isPublicPath(String path, String method) {
    if ("login".equals(path) && "POST".equalsIgnoreCase(method)) {
      return true;
    }
    if ("registro".equals(path) && "POST".equalsIgnoreCase(method)) {
      return true;
    }
    if ("health".equals(path) && "GET".equalsIgnoreCase(method)) {
      return true;
    }
    if ("GET".equalsIgnoreCase(method)) {
      if ("congreso/config".equals(path)) {
        return true;
      }
      if ("circulares".equals(path)) {
        return true;
      }
      if ("historia/congresos".equals(path)) {
        return true;
      }
      if ("actividades".equals(path)) {
        return true;
      }
    }
    return path.startsWith("openapi") || path.startsWith("swagger");
  }

  private static void abortUnauthorized(ContainerRequestContext ctx, String message) {
    ctx.abortWith(
        Response.status(Response.Status.UNAUTHORIZED)
            .type(MediaType.APPLICATION_JSON)
            .entity(Map.of("error", message))
            .build());
  }

  private static void abortForbidden(ContainerRequestContext ctx, String message) {
    ctx.abortWith(
        Response.status(Response.Status.FORBIDDEN)
            .type(MediaType.APPLICATION_JSON)
            .entity(Map.of("error", message, "accountDisabled", true))
            .build());
  }
}
