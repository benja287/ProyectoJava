package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;

@Path("/health")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Health")
public class HealthResource {

  @GET
  @Operation(summary = "Estado del servicio")
  @ApiResponse(responseCode = "200", description = "Servicio operativo")
  public Map<String, Object> health() {
    boolean jpa = JpaUtil.getEntityManagerFactory().isOpen();
    return Map.of("status", "ok", "grupo", 1, "jpa", jpa);
  }
}
