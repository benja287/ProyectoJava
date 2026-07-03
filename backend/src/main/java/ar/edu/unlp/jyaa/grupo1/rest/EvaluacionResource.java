package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.Evaluacion;
import ar.edu.unlp.jyaa.grupo1.rest.dto.EvaluacionRequest;
import ar.edu.unlp.jyaa.grupo1.servicio.EvaluacionService;
import ar.edu.unlp.jyaa.grupo1.web.dto.EvaluacionDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.net.URI;
import jakarta.ws.rs.core.Context;

@Path("/evaluaciones")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Evaluaciones")
public class EvaluacionResource {

  @Inject private EvaluacionService evaluacionService;

  @POST
  @Operation(summary = "Registrar evaluación de un trabajo")
  @ApiResponse(responseCode = "201", description = "Evaluación registrada")
  public Response registrar(EvaluacionRequest request, @Context UriInfo uriInfo) {
    try {
      Evaluacion evaluacion =
          evaluacionService.registrar(
              request.asignacionId(), request.recomendacion(), request.comentario());
      URI location = uriInfo.getAbsolutePathBuilder().path(evaluacion.getId().toString()).build();
      return Response.created(location).entity(EvaluacionDTO.from(evaluacion)).build();
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }
}
