package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
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
import java.util.Map;
import java.util.Optional;

/**
 * Valida Authorization: Bearer en rutas protegidas de /api.
 * Tras verificar el JWT, consulta activo en BD (sin caché) para que la
 * inhabilitación de cuentas sea efectiva al instante.
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
      // Preflight CORS: no autenticar acá (lo resuelve CorsRequestFilter).
      return;
    }

    String path = normalizePath(requestContext.getUriInfo().getPath());
    if (isPublicPath(path, method)) {
      // Endpoints públicos: login, registro, swagger y algunos GET (programa, circulares, etc.).
      return;
    }

    String authorization = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);
    if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
      // Sin header Authorization o sin prefijo "Bearer " → no hay credencial.
      abortUnauthorized(requestContext, "Token requerido");
      return;
    }

    String token = authorization.substring(7).trim();
    if (token.isEmpty()) {
      // Evita "Bearer    " (vacío).
      abortUnauthorized(requestContext, "Token requerido");
      return;
    }

    try {
      // 1) Valida firma + issuer + expiración (JwtService.parse).
      var claims = jwtService.parse(token);

      // 2) Publica info en el request context para que Resources/Services la lean vía AuthenticatedUser.
      requestContext.setProperty("jwtSubject", claims.getSubject());
      requestContext.setProperty("jwtEmail", claims.get("email", String.class));
      @SuppressWarnings("unchecked")
      var roles = (java.util.List<String>) claims.get("roles", java.util.List.class);
      requestContext.setProperty("jwtRoles", roles != null ? roles : java.util.List.of());

      // 3) Seguridad adicional: la cuenta debe seguir activa en BD.
      // Esto evita que un usuario deshabilitado siga operando con un token aún vigente.
      if (!isAccountActive(claims.getSubject(), requestContext)) {
        return;
      }
    } catch (JwtException e) {
      // Token inválido/expirado (mensaje ya normalizado en JwtService.parse).
      abortUnauthorized(requestContext, e.getMessage());
    }
  }

  private boolean isAccountActive(String subject, ContainerRequestContext requestContext) {
    Long userId;
    try {
      // subject = userId (string) definido por JwtService.generate().subject(...)
      userId = Long.parseLong(subject);
    } catch (NumberFormatException e) {
      abortUnauthorized(requestContext, "Token inválido");
      return false;
    }

    Optional<Boolean> activo = usuarioDAO.isActivoById(userId);
    if (activo.isEmpty()) {
      abortUnauthorized(requestContext, "Usuario no encontrado");
      return false;
    }
    if (!activo.get()) {
      // Caso especial para UX: el frontend detecta accountDisabled y muestra mensaje específico.
      abortForbidden(requestContext, "Cuenta deshabilitada");
      return false;
    }
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
