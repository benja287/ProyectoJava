package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.dao.CircularDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.Circular;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/circulares")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Circulares")
public class CircularesResource {

  @Inject private CircularDAO circularDAO;

  @GET
  @Operation(summary = "Listar circulares publicadas")
  @ApiResponse(responseCode = "200", description = "Listado de circulares")
  public List<Circular> listarPublicadas() {
    return circularDAO.listarPublicadas();
  }
}
