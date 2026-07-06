package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.AdminStatsService;
import ar.edu.unlp.jyaa.grupo1.servicio.TrabajoService;
import ar.edu.unlp.jyaa.grupo1.web.dto.AdminStatsDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.SolicitudAutorDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/admin/stats")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Admin")
public class AdminStatsResource {

  @Inject private AdminStatsService adminStatsService;
  @Inject private TrabajoService trabajoService;

  @GET
  @Path("/solicitudes-autor")
  @Operation(summary = "Asistentes con trabajos aprobados pendientes de rol autor")
  public List<SolicitudAutorDTO> solicitudesAutor(@Context ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
    return trabajoService.listarSolicitudesAutor();
  }

  @GET
  @Operation(summary = "Estadísticas ejecutivas para panel admin")
  public AdminStatsDTO stats(@Context ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
    return adminStatsService.obtener();
  }

  @GET
  @Path("/reporte")
  @Operation(summary = "Reporte detallado exportable (JSON)")
  public ar.edu.unlp.jyaa.grupo1.web.dto.AdminReportDTO reporte(
      @Context ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
    return adminStatsService.obtenerReporte();
  }
}
