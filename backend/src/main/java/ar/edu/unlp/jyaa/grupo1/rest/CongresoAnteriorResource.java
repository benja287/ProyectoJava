package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.servicio.CongresoAnteriorService;
import ar.edu.unlp.jyaa.grupo1.web.dto.CongresoAnteriorDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/historia/congresos")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Historia del Congreso")
public class CongresoAnteriorResource {

  @Inject private CongresoAnteriorService congresoAnteriorService;

  @GET
  @Operation(summary = "Listar ediciones anteriores del congreso (público)")
  public List<CongresoAnteriorDTO> listar() {
    return congresoAnteriorService.listar();
  }
}
