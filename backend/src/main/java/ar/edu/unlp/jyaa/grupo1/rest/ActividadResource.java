package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import ar.edu.unlp.jyaa.grupo1.servicio.ActividadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
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
import java.util.List;

@Path("/actividades")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Actividades")
public class ActividadResource {

  private final ActividadService actividadService;

  @Inject
  public ActividadResource(ActividadService actividadService) {
    this.actividadService = actividadService;
  }

  @GET
  @Operation(summary = "Listar actividades")
  @ApiResponse(responseCode = "200", description = "Listado de actividades")
  public List<Actividad> listar() {
    return actividadService.listar();
  }

  @GET
  @Path("/{id}")
  @Operation(summary = "Buscar actividad por id")
  @ApiResponse(responseCode = "200", description = "Actividad encontrada")
  @ApiResponse(responseCode = "404", description = "Actividad no encontrada")
  public Actividad buscar(@PathParam("id") Long id) {
    Actividad actividad = actividadService.buscar(id);
    if (actividad == null) {
      throw new NotFoundException("Actividad no encontrada");
    }
    return actividad;
  }

  @POST
  @Operation(summary = "Alta de actividad")
  @ApiResponse(responseCode = "201", description = "Actividad creada")
  public Response alta(Actividad actividad, @Context UriInfo uriInfo) {
    Actividad creada = actividadService.alta(actividad);
    URI location = uriInfo.getAbsolutePathBuilder().path(creada.getId().toString()).build();
    return Response.created(location).entity(creada).build();
  }

  @PUT
  @Path("/{id}")
  @Operation(summary = "Modificar actividad")
  @ApiResponse(responseCode = "200", description = "Actividad actualizada")
  @ApiResponse(responseCode = "404", description = "Actividad no encontrada")
  public Actividad modificar(@PathParam("id") Long id, Actividad actividad) {
    Actividad actualizada = actividadService.modificar(id, actividad);
    if (actualizada == null) {
      throw new NotFoundException("Actividad no encontrada");
    }
    return actualizada;
  }

  @DELETE
  @Path("/{id}")
  @Operation(summary = "Baja de actividad")
  @ApiResponse(responseCode = "204", description = "Actividad eliminada")
  @ApiResponse(responseCode = "404", description = "Actividad no encontrada")
  public Response baja(@PathParam("id") Long id) {
    if (actividadService.buscar(id) == null) {
      throw new NotFoundException("Actividad no encontrada");
    }
    actividadService.baja(id);
    return Response.noContent().build();
  }
}
