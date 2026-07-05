package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.rest.dto.CongresoConfigUpdateRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.CongresoService;
import ar.edu.unlp.jyaa.grupo1.web.dto.CongresoConfigDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;

@Path("/congreso")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Congreso")
public class CongresoResource {

  @Inject private CongresoService congresoService;

  @GET
  @Path("/config")
  @Operation(summary = "Configuración pública del congreso (programa y certificados)")
  public CongresoConfigDTO obtenerConfig() {
    return congresoService.obtenerConfig();
  }

  @PUT
  @Path("/config")
  @Operation(summary = "Actualizar configuración del congreso (admin)")
  public CongresoConfigDTO actualizarConfig(
      CongresoConfigUpdateRequest request, @Context ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
    return congresoService.actualizarConfig(request);
  }
}
