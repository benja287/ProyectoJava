package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.rest.dto.ActualizarActividadProgramaRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CrearConferenciaRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CrearMesaRedondaRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CrearMesaTematicaRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CrearSesionPostersRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.CrearTallerOficialRequest;
import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.ActividadService;
import ar.edu.unlp.jyaa.grupo1.web.dto.ActividadCronogramaDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.ActividadResumenDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaActividadesDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.container.ContainerRequestContext;
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

  @Inject private ActividadService actividadService;

  @GET
  @Operation(
      summary = "Listar actividades (paginado)",
      description =
          "Parámetros: page (desde 1, default 1), size (default 20, máx 100),"
              + " codigo, tipoActividad, titulo, sala.")
  @ApiResponse(responseCode = "200", description = "Página de actividades")
  public PaginaActividadesDTO listar(
      @QueryParam("page") @DefaultValue("1") int page,
      @QueryParam("size") @DefaultValue("20") int size,
      @QueryParam("codigo") String codigo,
      @QueryParam("tipoActividad") String tipoActividad,
      @QueryParam("titulo") String titulo,
      @QueryParam("sala") String sala) {
    var filtro = ActividadService.parseFiltro(codigo, tipoActividad, titulo, sala);
    return actividadService.listarPublico(page, size, filtro);
  }

  @GET
  @Path("/cronograma")
  @Operation(summary = "Cronograma completo del congreso (admin, con trabajos asignados)")
  public List<ActividadCronogramaDTO> cronogramaAdmin(@Context ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
    return actividadService.listarCronogramaAdmin();
  }

  @GET
  @Path("/{id}")
  @Operation(summary = "Buscar actividad por id")
  @ApiResponse(responseCode = "200", description = "Actividad encontrada")
  @ApiResponse(responseCode = "404", description = "Actividad no encontrada")
  public ActividadResumenDTO buscar(@PathParam("id") Long id) {
    Actividad actividad = actividadService.buscar(id);
    if (actividad == null) {
      throw new NotFoundException("Actividad no encontrada");
    }
    return ActividadResumenDTO.from(actividad);
  }

  @POST
  @Path("/mesa-tematica")
  @Operation(summary = "Crear mesa temática con trabajos orales aprobados")
  public Response crearMesaTematica(CrearMesaTematicaRequest request, @Context UriInfo uriInfo) {
    Actividad creada = actividadService.crearMesaTematica(request);
    URI location = uriInfo.getAbsolutePathBuilder().path(creada.getId().toString()).build();
    return Response.created(location).entity(ActividadResumenDTO.from(creada)).build();
  }

  @POST
  @Path("/sesion-posters")
  @Operation(summary = "Crear sesión de pósters con trabajos aprobados")
  public Response crearSesionPosters(CrearSesionPostersRequest request, @Context UriInfo uriInfo) {
    Actividad creada = actividadService.crearSesionPosters(request);
    URI location = uriInfo.getAbsolutePathBuilder().path(creada.getId().toString()).build();
    return Response.created(location).entity(ActividadResumenDTO.from(creada)).build();
  }

  @POST
  @Path("/mesa-redonda")
  @Operation(summary = "Crear mesa redonda en el programa oficial")
  public Response crearMesaRedonda(CrearMesaRedondaRequest request, @Context UriInfo uriInfo) {
    Actividad creada = actividadService.crearMesaRedonda(request);
    URI location = uriInfo.getAbsolutePathBuilder().path(creada.getId().toString()).build();
    return Response.created(location).entity(ActividadResumenDTO.from(creada)).build();
  }

  @POST
  @Path("/taller-oficial")
  @Operation(summary = "Crear taller en el programa oficial")
  public Response crearTallerOficial(CrearTallerOficialRequest request, @Context UriInfo uriInfo) {
    Actividad creada = actividadService.crearTallerOficial(request);
    URI location = uriInfo.getAbsolutePathBuilder().path(creada.getId().toString()).build();
    return Response.created(location).entity(ActividadResumenDTO.from(creada)).build();
  }

  @POST
  @Path("/conferencia")
  @Operation(summary = "Crear conferencia en el programa oficial")
  public Response crearConferencia(CrearConferenciaRequest request, @Context UriInfo uriInfo) {
    Actividad creada = actividadService.crearConferencia(request);
    URI location = uriInfo.getAbsolutePathBuilder().path(creada.getId().toString()).build();
    return Response.created(location).entity(ActividadResumenDTO.from(creada)).build();
  }

  @POST
  @Operation(summary = "Alta de actividad")
  @ApiResponse(responseCode = "201", description = "Actividad creada")
  public Response alta(Actividad actividad, @Context UriInfo uriInfo) {
    Actividad creada = actividadService.alta(actividad);
    URI location = uriInfo.getAbsolutePathBuilder().path(creada.getId().toString()).build();
    return Response.created(location).entity(ActividadResumenDTO.from(creada)).build();
  }

  @PUT
  @Path("/{id}/programa")
  @Operation(summary = "Actualizar actividad del cronograma oficial")
  public ActividadCronogramaDTO actualizarPrograma(
      @PathParam("id") Long id,
      ActualizarActividadProgramaRequest request,
      @Context ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
    Actividad actualizada = actividadService.actualizarPrograma(id, request);
    if (actualizada == null) {
      throw new NotFoundException("Actividad no encontrada");
    }
    return ActividadCronogramaDTO.from(actualizada);
  }

  @DELETE
  @Path("/{id}/trabajos/{trabajoId}")
  @Operation(summary = "Quitar trabajo de mesa temática o sesión de pósters")
  public Response quitarTrabajo(
      @PathParam("id") Long id,
      @PathParam("trabajoId") Long trabajoId,
      @Context ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
    actividadService.quitarTrabajo(id, trabajoId);
    return Response.noContent().build();
  }

  @PUT
  @Path("/{id}")
  @Operation(summary = "Modificar actividad")
  @ApiResponse(responseCode = "200", description = "Actividad actualizada")
  @ApiResponse(responseCode = "404", description = "Actividad no encontrada")
  public ActividadResumenDTO modificar(@PathParam("id") Long id, Actividad actividad) {
    Actividad actualizada = actividadService.modificar(id, actividad);
    if (actualizada == null) {
      throw new NotFoundException("Actividad no encontrada");
    }
    return ActividadResumenDTO.from(actualizada);
  }

  @DELETE
  @Path("/{id}")
  @Operation(summary = "Baja de actividad")
  @ApiResponse(responseCode = "204", description = "Actividad eliminada")
  @ApiResponse(responseCode = "404", description = "Actividad no encontrada")
  public Response baja(@PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
    if (actividadService.buscar(id) == null) {
      throw new NotFoundException("Actividad no encontrada");
    }
    actividadService.baja(id);
    return Response.noContent().build();
  }
}
