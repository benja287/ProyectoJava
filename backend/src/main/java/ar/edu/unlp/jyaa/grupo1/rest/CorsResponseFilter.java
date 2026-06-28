package ar.edu.unlp.jyaa.grupo1.rest;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;

/** Agrega headers CORS a las respuestas de la API. */
@Provider
public class CorsResponseFilter implements ContainerResponseFilter {

  @Override
  public void filter(
      ContainerRequestContext request, ContainerResponseContext response) {
    String origin = request.getHeaderString("Origin");
    if (origin == null || !CorsConfig.isAllowed(origin)) {
      return;
    }
    response.getHeaders().putSingle("Access-Control-Allow-Origin", origin);
    response.getHeaders().putSingle("Access-Control-Allow-Credentials", "true");
    response.getHeaders().add("Vary", "Origin");
  }
}
