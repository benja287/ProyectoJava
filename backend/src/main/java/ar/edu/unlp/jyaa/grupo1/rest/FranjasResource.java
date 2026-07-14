package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.rest.dto.FranjaHorariaRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.FranjaHorariaService;
import ar.edu.unlp.jyaa.grupo1.web.dto.FranjaHorariaDTO;
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
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/franjas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Franjas horarias")
public class FranjasResource {

  @Inject private FranjaHorariaService franjaHorariaService;

  @GET
  @Operation(summary = "Listar franjas activas (formularios de programa)")
  public List<FranjaHorariaDTO> listarActivas(@QueryParam("dia") Integer dia) {
    if (dia != null) {
      return franjaHorariaService.listarActivasPorDia(dia);
    }
    return franjaHorariaService.listarActivas();
  }

  @GET
  @Path("/admin")
  @Operation(summary = "Listar todas las franjas (admin)")
  public List<FranjaHorariaDTO> listarTodas(@Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return franjaHorariaService.listarTodas();
  }

  @POST
  @Operation(summary = "Crear franja (admin)")
  public FranjaHorariaDTO crear(FranjaHorariaRequest request, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return franjaHorariaService.crear(request);
  }

  @PUT
  @Path("/{id}")
  @Operation(summary = "Modificar franja (admin)")
  public FranjaHorariaDTO modificar(
      @PathParam("id") Long id, FranjaHorariaRequest request, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return franjaHorariaService.modificar(id, request);
  }

  @DELETE
  @Path("/{id}")
  @Operation(summary = "Desactivar franja (admin)")
  public Response desactivar(@PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    franjaHorariaService.desactivar(id);
    return Response.noContent().build();
  }

  private void requireAdmin(ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
  }
}
