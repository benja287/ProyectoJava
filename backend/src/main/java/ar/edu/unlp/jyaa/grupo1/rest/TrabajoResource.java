package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.rest.dto.DocumentoUploadForm;
import ar.edu.unlp.jyaa.grupo1.rest.dto.TrabajoCreateRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.TrabajoService;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaTrabajosDTO;
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
      @QueryParam("page") @DefaultValue("1") int page,
      @QueryParam("size") @DefaultValue("20") int size,
      @Context ContainerRequestContext ctx) {
    var filtro = TrabajoService.parseFiltro(titulo, resumen, ejeTematico, estado, autorId);
    return trabajoService.listar(page, size, filtro, AuthenticatedUser.from(ctx));
  }

  @GET
  @Path("/{id}")
  @Operation(summary = "Buscar trabajo por id")
  @ApiResponse(responseCode = "200", description = "Trabajo encontrado")
  @ApiResponse(responseCode = "404", description = "Trabajo no encontrado")
  public TrabajoResumenDTO buscar(@PathParam("id") Long id) {
    try {
      return TrabajoResumenDTO.from(trabajoService.buscar(id));
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
  @Path("/{id}/enviar")
  @Operation(summary = "Enviar trabajo a evaluación")
  @ApiResponse(responseCode = "200", description = "Trabajo enviado")
  @ApiResponse(responseCode = "404", description = "Trabajo no encontrado")
  public TrabajoResumenDTO enviar(@PathParam("id") Long id) {
    try {
      Trabajo trabajo = trabajoService.enviar(id);
      if (trabajo == null) {
        throw new NotFoundException("Trabajo no encontrado");
      }
      return TrabajoResumenDTO.from(trabajo);
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
      if (trabajo == null) {
        throw new NotFoundException("Trabajo no encontrado");
      }
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
