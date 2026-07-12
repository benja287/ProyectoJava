package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.rest.dto.ConfirmarComiteRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.DocumentoUploadForm;
import ar.edu.unlp.jyaa.grupo1.rest.dto.EnviarTrabajoRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.EvaluarPropuestaTallerRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.PrecheckRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.TrabajoCreateRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.TrabajoUpdateRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.TrabajoService;
import ar.edu.unlp.jyaa.grupo1.web.dto.PresentacionAutorDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaTrabajosDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.TrabajoEnvioResumenDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.TrabajoResumenDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
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
import java.io.IOException;
import java.net.URI;
import java.util.List;
import org.glassfish.jersey.media.multipart.FormDataParam;

@Path("/trabajos")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Trabajos")
public class TrabajoResource {

  @Inject private TrabajoService trabajoService;

  @GET
  @Operation(
      summary = "Listar trabajos (paginado)",
      description =
          "Devuelve una página de trabajos. Sin autorId lista todos; con autorId filtra por autor."
              + " Parámetros: page (desde 1, default 1), size (default 20, máx 100).")
  @ApiResponse(responseCode = "200", description = "Página de trabajos")
  public PaginaTrabajosDTO listar(
      @QueryParam("autorId") Long autorId,
      @QueryParam("titulo") String titulo,
      @QueryParam("resumen") String resumen,
      @QueryParam("ejeTematico") String ejeTematico,
      @QueryParam("estado") String estado,
      @QueryParam("modalidad") String modalidad,
      @QueryParam("tipo") String tipo,
      @QueryParam("page") @DefaultValue("1") int page,
      @QueryParam("size") @DefaultValue("20") int size,
      @Context ContainerRequestContext ctx) {
    var filtro =
        TrabajoService.parseFiltro(titulo, resumen, ejeTematico, estado, modalidad, tipo, autorId);
    return trabajoService.listar(page, size, filtro, AuthenticatedUser.from(ctx));
  }

  @GET
  @Path("/comite")
  @Operation(summary = "Listar trabajos visibles para el comité académico (paginado)")
  public PaginaTrabajosDTO listarParaComite(
      @QueryParam("titulo") String titulo,
      @QueryParam("ejeTematico") String ejeTematico,
      @QueryParam("estado") String estado,
      @QueryParam("page") @DefaultValue("1") int page,
      @QueryParam("size") @DefaultValue("20") int size,
      @Context ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).canListAllTrabajos()) {
      throw new NotAuthorizedException("Solo comité académico o administrador");
    }
    var filtro = TrabajoService.parseFiltro(titulo, null, ejeTematico, estado, null, null, null);
    return trabajoService.listarParaComite(page, size, filtro);
  }

  @GET
  @Path("/resumen-envio")
  @Operation(summary = "Resumen de cupos y límites de envío para un autor")
  public TrabajoEnvioResumenDTO resumenEnvio(
      @QueryParam("autorId") Long autorId,
      @QueryParam("rolEnvio") @DefaultValue("ASISTENTE") String rolEnvio,
      @Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    Long effectiveAutorId = autorId != null ? autorId : auth.userId();
    if (!auth.canListAllTrabajos() && !auth.userId().equals(effectiveAutorId)) {
      throw new NotAuthorizedException("No autorizado");
    }
    try {
      return trabajoService.obtenerResumenEnvio(effectiveAutorId, rolEnvio);
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @GET
  @Path("/mis-presentaciones")
  @Operation(summary = "Presentaciones programadas del autor (mesas y pósters)")
  public List<PresentacionAutorDTO> misPresentaciones(
      @QueryParam("autorId") Long autorId, @Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    Long effectiveAutorId = autorId != null ? autorId : auth.userId();
    if (!auth.canListAllTrabajos() && !auth.userId().equals(effectiveAutorId)) {
      throw new NotAuthorizedException("No autorizado");
    }
    try {
      return trabajoService.listarPresentacionesAutor(effectiveAutorId);
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @GET
  @Path("/{id}")
  @Operation(summary = "Buscar trabajo por id")
  @ApiResponse(responseCode = "200", description = "Trabajo encontrado")
  @ApiResponse(responseCode = "404", description = "Trabajo no encontrado")
  public TrabajoResumenDTO buscar(@PathParam("id") Long id) {
    try {
      return trabajoService.buscarResumen(id);
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Crear trabajo")
  @ApiResponse(responseCode = "201", description = "Trabajo creado")
  public Response crear(TrabajoCreateRequest request, @Context UriInfo uriInfo) {
    Trabajo creado = trabajoService.crear(request.autorId(), request.trabajo());
    URI location = uriInfo.getAbsolutePathBuilder().path(creado.getId().toString()).build();
    return Response.created(location).entity(TrabajoResumenDTO.from(creado)).build();
  }

  @PUT
  @Path("/{id}")
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Modificar trabajo (borrador u observado)")
  public TrabajoResumenDTO modificar(@PathParam("id") Long id, TrabajoUpdateRequest request) {
    try {
      return TrabajoResumenDTO.from(trabajoService.modificar(id, request));
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @PUT
  @Path("/{id}/enviar")
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Enviar trabajo a evaluación")
  @ApiResponse(responseCode = "200", description = "Trabajo enviado")
  @ApiResponse(responseCode = "404", description = "Trabajo no encontrado")
  public TrabajoResumenDTO enviar(
      @PathParam("id") Long id, EnviarTrabajoRequest request) {
    try {
      String rolEnvio = request != null ? request.rolEnvio() : null;
      Trabajo trabajo = trabajoService.enviar(id, rolEnvio);
      return TrabajoResumenDTO.from(trabajo);
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @GET
  @Path("/aprobados")
  @Operation(summary = "Trabajos aprobados por el comité listos para programar en cronograma")
  public List<TrabajoResumenDTO> listarAprobados(
      @QueryParam("modalidad") String modalidad, @Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    if (!auth.isAdmin() && !auth.canListAllTrabajos()) {
      throw new NotAuthorizedException("No autorizado");
    }
    try {
      return trabajoService.listarAprobadosParaProgramacion(modalidad);
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @GET
  @Path("/propuestas-taller/pendientes")
  @Operation(summary = "Listar propuestas de taller pendientes para evaluadores")
  public List<TrabajoResumenDTO> listarPropuestasTallerPendientes(
      @Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    if (!auth.hasRole("EVALUADOR")) {
      throw new NotAuthorizedException("Solo evaluadores");
    }
    try {
      return trabajoService.listarPropuestasTallerPendientes(auth.userId());
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @PUT
  @Path("/{id}/evaluar-propuesta-taller")
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Aprobar o rechazar propuesta de taller")
  public TrabajoResumenDTO evaluarPropuestaTaller(
      @PathParam("id") Long id,
      EvaluarPropuestaTallerRequest request,
      @Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    if (!auth.hasRole("EVALUADOR")) {
      throw new NotAuthorizedException("Solo evaluadores");
    }
    if (request == null) {
      throw new ar.edu.unlp.jyaa.grupo1.servicio.NegocioException(
          "Debe indicar si aprueba (aprobar: true/false)");
    }
    try {
      return TrabajoResumenDTO.from(
          trabajoService.evaluarPropuestaTaller(
              id, request.aprobar(), request.comentario(), auth.userId()));
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @PUT
  @Path("/{id}/precheck")
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Precheck del comité académico (apto u observado)")
  public TrabajoResumenDTO precheck(
      @PathParam("id") Long id,
      PrecheckRequest request,
      @Context ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).canListAllTrabajos()) {
      throw new NotAuthorizedException("Solo comité académico o administrador");
    }
    if (request == null) {
      throw new ar.edu.unlp.jyaa.grupo1.servicio.NegocioException(
          "Debe indicar si el trabajo es apto (apto: true/false)");
    }
    try {
      return TrabajoResumenDTO.from(
          trabajoService.registrarPrecheck(
              id, request.apto(), request.observaciones()));
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @PUT
  @Path("/{id}/confirmar-comite")
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Confirmación final del comité tras evaluaciones")
  public TrabajoResumenDTO confirmarComite(
      @PathParam("id") Long id,
      ConfirmarComiteRequest request,
      @Context ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).canListAllTrabajos()) {
      throw new NotAuthorizedException("Solo comité académico o administrador");
    }
    if (request == null) {
      throw new ar.edu.unlp.jyaa.grupo1.servicio.NegocioException(
          "Debe indicar si se aprueba (aprobar: true/false)");
    }
    try {
      return TrabajoResumenDTO.from(
          trabajoService.confirmarAprobacionComite(id, request.aprobar(), request.observaciones()));
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @POST
  @Path("/{id}/documento")
  @Consumes(MediaType.MULTIPART_FORM_DATA)
  @Operation(
      summary = "Adjuntar documento al trabajo",
      requestBody =
          @RequestBody(
              required = true,
              content =
                  @Content(
                      mediaType = MediaType.MULTIPART_FORM_DATA,
                      schema = @Schema(implementation = DocumentoUploadForm.class))))
  @ApiResponse(responseCode = "200", description = "Documento adjuntado")
  @ApiResponse(responseCode = "404", description = "Trabajo no encontrado")
  public TrabajoResumenDTO adjuntarDocumento(
      @PathParam("id") Long id,
      @FormDataParam("file") java.io.InputStream file,
      @FormDataParam("file")
          org.glassfish.jersey.media.multipart.FormDataContentDisposition fileDetail)
      throws IOException {
    if (file == null) {
      throw new ar.edu.unlp.jyaa.grupo1.servicio.NegocioException("Debe adjuntar un archivo");
    }
    String nombre = fileDetail != null ? fileDetail.getFileName() : "documento.pdf";
    try {
      Trabajo trabajo = trabajoService.adjuntarDocumento(id, file, nombre);
      return TrabajoResumenDTO.from(trabajo);
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @DELETE
  @Path("/{id}")
  @Operation(summary = "Baja de trabajo (admin / limpieza)")
  @ApiResponse(responseCode = "204", description = "Trabajo eliminado")
  @ApiResponse(responseCode = "404", description = "Trabajo no encontrado")
  public Response baja(@PathParam("id") Long id) {
    try {
      trabajoService.baja(id);
      return Response.noContent().build();
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }
}
