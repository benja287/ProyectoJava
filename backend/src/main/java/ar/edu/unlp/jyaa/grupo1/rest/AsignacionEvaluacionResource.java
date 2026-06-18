package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.rest.dto.AsignacionRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.RespuestaAsignacionRequest;
import ar.edu.unlp.jyaa.grupo1.servicio.AsignacionEvaluacionService;
import ar.edu.unlp.jyaa.grupo1.web.dto.AsignacionEvaluacionDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.net.URI;

@Path("/asignaciones-evaluacion")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Asignaciones de evaluación")
public class AsignacionEvaluacionResource {

  @Inject private AsignacionEvaluacionService asignacionService;

  @POST
  @Operation(summary = "Asignar evaluador a trabajo")
  @ApiResponse(responseCode = "201", description = "Asignación creada")
  @ApiResponse(responseCode = "400", description = "Error de validación")
  public Response asignar(AsignacionRequest request, @Context UriInfo uriInfo) {
    AsignacionEvaluacion asignacion =
        asignacionService.asignar(request.trabajoId(), request.evaluadorId());
    URI location = uriInfo.getAbsolutePathBuilder().path(asignacion.getId().toString()).build();
    return Response.created(location).entity(AsignacionEvaluacionDTO.from(asignacion)).build();
  }

  @DELETE
  @Path("/{id}")
  @Operation(summary = "Desasignar evaluador")
  @ApiResponse(responseCode = "204", description = "Asignación eliminada")
  @ApiResponse(responseCode = "404", description = "Asignación no encontrada")
  public Response desasignar(@PathParam("id") Long id) {
    try {
      asignacionService.desasignar(id);
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
    return Response.noContent().build();
  }

  @PUT
  @Path("/{id}/respuesta")
  @Operation(summary = "Responder asignación de evaluación")
  @ApiResponse(responseCode = "200", description = "Respuesta registrada")
  @ApiResponse(responseCode = "404", description = "Asignación no encontrada")
  public AsignacionEvaluacionDTO responder(
      @PathParam("id") Long id, RespuestaAsignacionRequest request) {
    try {
      AsignacionEvaluacion asignacion = asignacionService.responder(id, request.aceptar());
      return AsignacionEvaluacionDTO.from(asignacion);
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }
}
