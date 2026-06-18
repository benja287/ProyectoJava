package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.servicio.CircularService;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaCircularesDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

@Path("/circulares")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Circulares")
public class CircularesResource {

  @Inject private CircularService circularService;

  @GET
  @Operation(summary = "Listar circulares publicadas")
  @ApiResponse(responseCode = "200", description = "Listado paginado de circulares")
  public PaginaCircularesDTO listarPublicadas(
      @QueryParam("page") @DefaultValue("1") int page,
      @QueryParam("size") @DefaultValue("20") int size) {
    return circularService.listarPublicadas(page, size);
  }
}
