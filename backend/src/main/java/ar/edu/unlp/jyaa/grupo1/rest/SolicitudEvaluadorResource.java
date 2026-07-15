package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.rest.dto.SolicitudEvaluadorCreateRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.ValidarSolicitudEvaluadorRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.SolicitudEvaluadorService;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaSolicitudesEvaluadorDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.SolicitudEvaluadorDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
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

@Path("/solicitudes-evaluador")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Solicitudes de evaluador")
public class SolicitudEvaluadorResource {

  @Inject private SolicitudEvaluadorService solicitudEvaluadorService;

  @GET
  @Path("/mia")
  @Operation(summary = "Última solicitud del usuario autenticado")
  public Response mia(@Context ContainerRequestContext ctx) {
    SolicitudEvaluadorDTO dto =
        solicitudEvaluadorService.miSolicitud(AuthenticatedUser.from(ctx).userId());
    if (dto == null) {
      return Response.noContent().build();
    }
    return Response.ok(dto).build();
  }

  @POST
  @Operation(summary = "Crear solicitud para integrar el comité de evaluadores")
  public SolicitudEvaluadorDTO crear(
      SolicitudEvaluadorCreateRequest request, @Context ContainerRequestContext ctx) {
    return solicitudEvaluadorService.crear(AuthenticatedUser.from(ctx).userId(), request);
  }

  @GET
  @Operation(summary = "Listar solicitudes (comité / admin)")
  public PaginaSolicitudesEvaluadorDTO listar(
      @QueryParam("page") @DefaultValue("1") int page,
      @QueryParam("size") @DefaultValue("20") int size,
      @QueryParam("estado") String estado,
      @Context ContainerRequestContext ctx) {
    return solicitudEvaluadorService.listar(page, size, estado, AuthenticatedUser.from(ctx));
  }

  @GET
  @Path("/{id}")
  @Operation(summary = "Detalle de solicitud")
  public SolicitudEvaluadorDTO obtener(
      @PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    return solicitudEvaluadorService.obtener(id, AuthenticatedUser.from(ctx));
  }

  @PUT
  @Path("/{id}/validar")
  @Operation(summary = "Aprobar o rechazar solicitud (comité / admin)")
  public SolicitudEvaluadorDTO validar(
      @PathParam("id") Long id,
      ValidarSolicitudEvaluadorRequest request,
      @Context ContainerRequestContext ctx) {
    return solicitudEvaluadorService.validar(id, request, AuthenticatedUser.from(ctx));
  }

  @POST
  @Path("/{id}/invitar-taller")
  @Operation(summary = "Enviar invitación al taller de evaluadorxs por email/notificación")
  public SolicitudEvaluadorDTO invitarTaller(
      @PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    return solicitudEvaluadorService.invitarTaller(id, AuthenticatedUser.from(ctx));
  }
}
