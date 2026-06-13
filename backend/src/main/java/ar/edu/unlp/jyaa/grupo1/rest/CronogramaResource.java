package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.CronogramaPersonal;
import ar.edu.unlp.jyaa.grupo1.servicio.CronogramaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/cronograma")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Cronograma personal")
public class CronogramaResource {

  private final CronogramaService cronogramaService;

  @Inject
  public CronogramaResource(CronogramaService cronogramaService) {
    this.cronogramaService = cronogramaService;
  }

  @GET
  @Path("/{usuarioId}")
  @Operation(summary = "Obtener cronograma de un usuario")
  @ApiResponse(responseCode = "200", description = "Cronograma encontrado")
  @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
  public CronogramaPersonal obtener(@PathParam("usuarioId") Long usuarioId) {
    CronogramaPersonal cronograma = cronogramaService.obtenerCronograma(usuarioId);
    if (cronograma == null) {
      throw new NotFoundException("Usuario no encontrado");
    }
    return cronograma;
  }

  @POST
  @Path("/{usuarioId}/actividades/{actividadId}")
  @Operation(summary = "Agregar actividad al cronograma")
  @ApiResponse(responseCode = "200", description = "Actividad agregada")
  @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
  public CronogramaPersonal agregarActividad(
      @PathParam("usuarioId") Long usuarioId, @PathParam("actividadId") Long actividadId) {
    CronogramaPersonal cronograma = cronogramaService.agregarActividad(usuarioId, actividadId);
    if (cronograma == null) {
      throw new NotFoundException("Usuario no encontrado");
    }
    return cronograma;
  }

  @DELETE
  @Path("/{usuarioId}/actividades/{actividadId}")
  @Operation(summary = "Quitar actividad del cronograma")
  @ApiResponse(responseCode = "204", description = "Actividad quitada")
  @ApiResponse(responseCode = "404", description = "Cronograma no encontrado")
  public Response quitarActividad(
      @PathParam("usuarioId") Long usuarioId, @PathParam("actividadId") Long actividadId) {
    CronogramaPersonal cronograma = cronogramaService.quitarActividad(usuarioId, actividadId);
    if (cronograma == null) {
      throw new NotFoundException("Cronograma no encontrado");
    }
    return Response.noContent().build();
  }
}
