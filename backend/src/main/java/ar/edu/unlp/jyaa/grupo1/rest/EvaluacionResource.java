package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.Evaluacion;
import ar.edu.unlp.jyaa.grupo1.rest.dto.DocumentoUploadForm;
import ar.edu.unlp.jyaa.grupo1.rest.dto.EvaluacionRequest;
import ar.edu.unlp.jyaa.grupo1.servicio.EvaluacionService;
import ar.edu.unlp.jyaa.grupo1.servicio.NegocioException;
import ar.edu.unlp.jyaa.grupo1.web.dto.EvaluacionDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.io.IOException;
import java.net.URI;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;

@Path("/evaluaciones")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Evaluaciones")
public class EvaluacionResource {

  @Inject private EvaluacionService evaluacionService;

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Registrar evaluación / dictamen de un trabajo")
  @ApiResponse(responseCode = "201", description = "Evaluación registrada")
  public Response registrar(EvaluacionRequest request, @Context UriInfo uriInfo) {
    try {
      Evaluacion evaluacion = evaluacionService.registrar(request);
      URI location = uriInfo.getAbsolutePathBuilder().path(evaluacion.getId().toString()).build();
      return Response.created(location).entity(EvaluacionDTO.from(evaluacion)).build();
    } catch (NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @GET
  @Path("/{id}")
  @Operation(summary = "Obtener evaluación por id")
  public EvaluacionDTO obtener(@PathParam("id") Long id) {
    try {
      return EvaluacionDTO.from(evaluacionService.buscar(id));
    } catch (NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @POST
  @Path("/{id}/archivo-correccion")
  @Consumes(MediaType.MULTIPART_FORM_DATA)
  @Operation(summary = "Adjuntar archivo de correcciones para autorxs")
  @RequestBody(
      content =
          @Content(
              mediaType = MediaType.MULTIPART_FORM_DATA,
              schema = @Schema(implementation = DocumentoUploadForm.class)))
  @ApiResponse(responseCode = "200", description = "Archivo adjunto")
  public EvaluacionDTO adjuntarArchivo(
      @PathParam("id") Long id,
      @FormDataParam("file") java.io.InputStream file,
      @FormDataParam("file") FormDataContentDisposition fileDetail)
      throws IOException {
    if (file == null) {
      throw new NegocioException("Debe adjuntar un archivo");
    }
    String nombre = fileDetail != null ? fileDetail.getFileName() : "correcciones.pdf";
    try {
      return EvaluacionDTO.from(evaluacionService.adjuntarArchivoCorreccion(id, file, nombre));
    } catch (NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }
}
