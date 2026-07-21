package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.CronogramaPersonal;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.servicio.CongresoService;
import ar.edu.unlp.jyaa.grupo1.servicio.CronogramaService;
import ar.edu.unlp.jyaa.grupo1.web.dto.CronogramaDTO;
import java.util.List;
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

  @Inject private CronogramaService cronogramaService;
  @Inject private CongresoService congresoService;

  @GET
  @Path("/{usuarioId}")
  @Operation(summary = "Obtener cronograma de un usuario")
  @ApiResponse(responseCode = "200", description = "Cronograma encontrado")
  @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
  public CronogramaDTO obtener(@PathParam("usuarioId") Long usuarioId) {
    try {
      CronogramaPersonal cronograma = cronogramaService.obtenerCronograma(usuarioId);
      if (!congresoService.isProgramaPublicado()) {
        Usuario u = cronograma.getUsuario();
        return new CronogramaDTO(
            cronograma.getId(),
            u != null ? u.getId() : null,
            u != null ? u.getNombre() : null,
            u != null ? u.getApellido() : null,
            List.of());
      }
      return cronogramaService.toDto(cronograma);
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @POST
  @Path("/{usuarioId}/actividades/{actividadId}")
  @Operation(summary = "Agregar actividad al cronograma")
  @ApiResponse(responseCode = "200", description = "Actividad agregada")
  @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
  public CronogramaDTO agregarActividad(
      @PathParam("usuarioId") Long usuarioId, @PathParam("actividadId") Long actividadId) {
    try {
      CronogramaPersonal cronograma = cronogramaService.agregarActividad(usuarioId, actividadId);
      return cronogramaService.toDto(cronograma);
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      if (e.getMessage().contains("Usuario no encontrado")) {
        throw new NotFoundException(e.getMessage());
      }
      throw e;
    }
  }

  @DELETE
  @Path("/{usuarioId}/actividades/{actividadId}")
  @Operation(summary = "Quitar actividad del cronograma")
  @ApiResponse(responseCode = "204", description = "Actividad quitada")
  @ApiResponse(responseCode = "404", description = "Cronograma no encontrado")
  public Response quitarActividad(
      @PathParam("usuarioId") Long usuarioId, @PathParam("actividadId") Long actividadId) {
    try {
      cronogramaService.quitarActividad(usuarioId, actividadId);
      return Response.noContent().build();
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }
}
