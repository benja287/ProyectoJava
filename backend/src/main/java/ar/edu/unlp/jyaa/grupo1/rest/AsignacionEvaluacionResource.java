package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.rest.dto.AsignacionRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.RespuestaAsignacionRequest;
import ar.edu.unlp.jyaa.grupo1.servicio.AsignacionEvaluacionService;
import ar.edu.unlp.jyaa.grupo1.web.dto.AsignacionEvaluacionDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaAsignacionesDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.ResumenAsignacionesEvaluadorDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import java.util.List;
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

  @GET
  @Path("/resumen")
  @Operation(summary = "Contadores de asignaciones del evaluador")
  public ResumenAsignacionesEvaluadorDTO resumen(@QueryParam("evaluadorId") Long evaluadorId) {
    if (evaluadorId == null) {
      throw new BadRequestException("Indicar evaluadorId");
    }
    return asignacionService.resumenPorEvaluador(evaluadorId);
  }

  @GET
  @Operation(
      summary = "Listar asignaciones",
      description =
          "Por evaluadorId: paginado (page/size) y filtro soloPendientes. Por trabajoId: listado completo.")
  @ApiResponse(responseCode = "200", description = "Listado de asignaciones")
  public Object listar(
      @QueryParam("evaluadorId") Long evaluadorId,
      @QueryParam("trabajoId") Long trabajoId,
      @QueryParam("soloPendientes") @DefaultValue("false") boolean soloPendientes,
      @QueryParam("page") @DefaultValue("1") int page,
      @QueryParam("size") @DefaultValue("20") int size) {
    if (evaluadorId != null) {
      return asignacionService.listarPorEvaluador(evaluadorId, page, size, soloPendientes);
    }
    if (trabajoId != null) {
      List<AsignacionEvaluacionDTO> items =
          asignacionService.listarPorTrabajo(trabajoId).stream()
              .map(AsignacionEvaluacionDTO::from)
              .toList();
      return new PaginaAsignacionesDTO(items, 1, items.size() == 0 ? size : items.size(), items.size(), 1);
    }
    throw new BadRequestException("Indicar evaluadorId o trabajoId");
  }

  @POST
  @Path("/batch")
  @Operation(summary = "Asignar varios evaluadores a un trabajo")
  public Response asignarVarios(
      ar.edu.unlp.jyaa.grupo1.rest.dto.AsignarEvaluadoresRequest request, @Context UriInfo uriInfo) {
    var creadas =
        asignacionService.asignarVarios(
            request.trabajoId(),
            request.evaluadorIds(),
            request.tercerEvaluadorEmpate());
    return Response.ok(creadas.stream().map(AsignacionEvaluacionDTO::from).toList()).build();
  }

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
