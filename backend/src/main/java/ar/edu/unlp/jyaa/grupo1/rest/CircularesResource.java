package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.rest.dto.CircularRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.CircularService;
import ar.edu.unlp.jyaa.grupo1.web.dto.CircularResumenDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaCircularesDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/circulares")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Circulares")
public class CircularesResource {

  @Inject private CircularService circularService;

  @GET
  @Operation(summary = "Listar circulares publicadas")
  @ApiResponse(responseCode = "200", description = "Listado paginado de circulares")
  public PaginaCircularesDTO listarPublicadas(
      @QueryParam("page") @DefaultValue("1") int page,
      @QueryParam("size") @DefaultValue("20") int size) {
    return circularService.listarPublicadas(page, size);
  }

  @GET
  @Path("/admin")
  @Operation(summary = "Listar todas las circulares (admin)")
  public PaginaCircularesDTO listarTodas(
      @QueryParam("page") @DefaultValue("1") int page,
      @QueryParam("size") @DefaultValue("50") int size,
      @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return circularService.listarTodas(page, size);
  }

  @GET
  @Path("/{id}")
  @Operation(summary = "Obtener circular por id (admin)")
  public CircularResumenDTO obtener(@PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return circularService.obtener(id);
  }

  @POST
  @Operation(summary = "Crear circular (admin)")
  public CircularResumenDTO crear(CircularRequest request, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return circularService.crear(request);
  }

  @PUT
  @Path("/{id}")
  @Operation(summary = "Modificar circular (admin)")
  public CircularResumenDTO modificar(
      @PathParam("id") Long id, CircularRequest request, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return circularService.modificar(id, request);
  }

  @PUT
  @Path("/{id}/publicar")
  @Operation(summary = "Alternar publicación de circular (admin)")
  public CircularResumenDTO alternarPublicacion(
      @PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return circularService.alternarPublicacion(id);
  }

  @DELETE
  @Path("/{id}")
  @Operation(summary = "Eliminar circular (admin)")
  public Response eliminar(@PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    circularService.eliminar(id);
    return Response.noContent().build();
  }

  private void requireAdmin(ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
  }
}
