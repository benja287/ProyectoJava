package ar.edu.unlp.jyaa.grupo1.rest;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.PreMatching;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

/** Responde preflight OPTIONS con headers CORS. */
@Provider
@PreMatching
public class CorsRequestFilter implements ContainerRequestFilter {

  private static final String ALLOWED_HEADERS =
      "origin, content-type, accept, authorization, x-requested-with";
  private static final String ALLOWED_METHODS = "GET, POST, PUT, DELETE, OPTIONS, HEAD";

  @Override
  public void filter(ContainerRequestContext request) {
    if (!"OPTIONS".equalsIgnoreCase(request.getMethod())) {
      return;
    }
    String origin = request.getHeaderString("Origin");
    if (!CorsConfig.isAllowed(origin)) {
      request.abortWith(Response.status(Response.Status.FORBIDDEN).build());
      return;
    }
    request.abortWith(
        Response.ok()
            .header("Access-Control-Allow-Origin", origin)
            .header("Access-Control-Allow-Credentials", "true")
            .header("Access-Control-Allow-Headers", ALLOWED_HEADERS)
            .header("Access-Control-Allow-Methods", ALLOWED_METHODS)
            .header("Access-Control-Max-Age", "86400")
            .build());
  }
}
