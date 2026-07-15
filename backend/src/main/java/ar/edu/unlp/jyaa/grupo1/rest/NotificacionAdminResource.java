package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.NotificacionAdminService;
import ar.edu.unlp.jyaa.grupo1.web.dto.LimpiezaNotificacionResultDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.NotificacionAdminDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.NotificacionResumenDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaNotificacionesDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/admin/notificaciones")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Admin — Notificaciones")
public class NotificacionAdminResource {

  @Inject private NotificacionAdminService notificacionAdminService;

  @GET
  @Operation(summary = "Listar notificaciones in-app de todos los usuarios (admin)")
  public PaginaNotificacionesDTO listar(
      @QueryParam("page") @DefaultValue("1") int page,
      @QueryParam("size") @DefaultValue("20") int size,
      @QueryParam("leida") Boolean leida,
      @QueryParam("destinatario") String destinatario,
      @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return notificacionAdminService.listar(page, size, leida, destinatario);
  }

  @GET
  @Path("/resumen")
  @Operation(summary = "Totales de notificaciones in-app (admin)")
  public NotificacionResumenDTO resumen(@Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return notificacionAdminService.resumen();
  }

  @GET
  @Path("/{id}")
  @Operation(summary = "Detalle de una notificación (admin)")
  public NotificacionAdminDTO obtener(@PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return notificacionAdminService.obtener(id);
  }

  @DELETE
  @Path("/{id}")
  @Operation(summary = "Eliminar una notificación (admin)")
  public Response eliminar(@PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    notificacionAdminService.eliminar(id);
    return Response.noContent().build();
  }

  @DELETE
  @Operation(
      summary = "Limpieza masiva de notificaciones (admin)",
      description = "alcance: leidas | antiguos | todos. Para antiguos, opcional dias (default 30).")
  public LimpiezaNotificacionResultDTO limpiar(
      @QueryParam("alcance") String alcance,
      @QueryParam("dias") Integer dias,
      @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return notificacionAdminService.limpiar(alcance, dias);
  }

  private static void requireAdmin(ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
  }
}
