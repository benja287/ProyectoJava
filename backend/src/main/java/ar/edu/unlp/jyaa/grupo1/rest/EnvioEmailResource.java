package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.EnvioEmailAdminService;
import ar.edu.unlp.jyaa.grupo1.web.dto.EnvioEmailDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.EnvioEmailResumenDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.LimpiezaEnvioEmailResultDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaEnviosEmailDTO;
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

@Path("/admin/emails")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Admin — Historial de emails")
public class EnvioEmailResource {

  @Inject private EnvioEmailAdminService envioEmailAdminService;

  @GET
  @Operation(summary = "Listar historial de envíos de email (admin)")
  public PaginaEnviosEmailDTO listar(
      @QueryParam("page") @DefaultValue("1") int page,
      @QueryParam("size") @DefaultValue("20") int size,
      @QueryParam("enviado") Boolean enviado,
      @QueryParam("destinatario") String destinatario,
      @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return envioEmailAdminService.listar(page, size, enviado, destinatario);
  }

  @GET
  @Path("/resumen")
  @Operation(summary = "Totales de envíos exitosos y fallidos (admin)")
  public EnvioEmailResumenDTO resumen(@Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return envioEmailAdminService.resumen();
  }

  @GET
  @Path("/{id}")
  @Operation(summary = "Detalle de un envío de email (admin)")
  public EnvioEmailDTO obtener(@PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return envioEmailAdminService.obtener(id);
  }

  @DELETE
  @Path("/{id}")
  @Operation(summary = "Eliminar un registro del historial (admin)")
  public Response eliminar(@PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    envioEmailAdminService.eliminar(id);
    return Response.noContent().build();
  }

  @DELETE
  @Operation(
      summary = "Limpieza masiva del historial (admin)",
      description = "alcance: fallidos | antiguos | todos. Para antiguos, opcional dias (default 30).")
  public LimpiezaEnvioEmailResultDTO limpiar(
      @QueryParam("alcance") String alcance,
      @QueryParam("dias") Integer dias,
      @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return envioEmailAdminService.limpiar(alcance, dias);
  }

  private static void requireAdmin(ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
  }
}
