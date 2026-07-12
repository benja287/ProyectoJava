package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.rest.dto.AulaRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.AulaService;
import ar.edu.unlp.jyaa.grupo1.web.dto.AulaDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/aulas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Aulas")
public class AulasResource {

  @Inject private AulaService aulaService;

  @GET
  @Operation(summary = "Listar aulas activas (para formularios de programa)")
  public List<AulaDTO> listarActivas() {
    return aulaService.listarActivas();
  }

  @GET
  @Path("/admin")
  @Operation(summary = "Listar todas las aulas (admin)")
  public List<AulaDTO> listarTodas(@Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return aulaService.listarTodas();
  }

  @GET
  @Path("/{id}")
  @Operation(summary = "Obtener aula por id (admin)")
  public AulaDTO obtener(@PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return aulaService.obtener(id);
  }

  @POST
  @Operation(summary = "Crear aula (admin)")
  public AulaDTO crear(AulaRequest request, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return aulaService.crear(request);
  }

  @PUT
  @Path("/{id}")
  @Operation(summary = "Modificar aula (admin)")
  public AulaDTO modificar(
      @PathParam("id") Long id, AulaRequest request, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return aulaService.modificar(id, request);
  }

  @DELETE
  @Path("/{id}")
  @Operation(summary = "Desactivar aula (admin, baja lógica)")
  public Response eliminar(@PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    aulaService.eliminar(id);
    return Response.noContent().build();
  }

  private void requireAdmin(ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
  }
}
