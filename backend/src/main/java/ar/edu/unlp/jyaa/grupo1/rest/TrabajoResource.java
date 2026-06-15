package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import ar.edu.unlp.jyaa.grupo1.rest.dto.TrabajoCreateRequest;
import ar.edu.unlp.jyaa.grupo1.servicio.TrabajoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
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
  @Operation(summary = "Listar trabajos")
  @ApiResponse(responseCode = "200", description = "Listado de trabajos")
  public List<Trabajo> listar(@QueryParam("autorId") Long autorId) {
    if (autorId != null) {
      return trabajoService.listarPorAutor(autorId);
    }
    return trabajoService.listar();
  }

  @GET
  @Path("/{id}")
  @Operation(summary = "Buscar trabajo por id")
  @ApiResponse(responseCode = "200", description = "Trabajo encontrado")
  @ApiResponse(responseCode = "404", description = "Trabajo no encontrado")
  public Trabajo buscar(@PathParam("id") Long id) {
    Trabajo trabajo = trabajoService.buscar(id);
    if (trabajo == null) {
      throw new NotFoundException("Trabajo no encontrado");
    }
    return trabajo;
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Crear trabajo")
  @ApiResponse(responseCode = "201", description = "Trabajo creado")
  public Response crear(TrabajoCreateRequest request, @Context UriInfo uriInfo) {
    Trabajo creado = trabajoService.crear(request.autorId(), request.trabajo());
    URI location = uriInfo.getAbsolutePathBuilder().path(creado.getId().toString()).build();
    return Response.created(location).entity(creado).build();
  }

  @PUT
  @Path("/{id}/enviar")
  @Operation(summary = "Enviar trabajo a evaluación")
  @ApiResponse(responseCode = "200", description = "Trabajo enviado")
  @ApiResponse(responseCode = "404", description = "Trabajo no encontrado")
  public Trabajo enviar(@PathParam("id") Long id) {
    Trabajo trabajo = trabajoService.enviar(id);
    if (trabajo == null) {
      throw new NotFoundException("Trabajo no encontrado");
    }
    return trabajo;
  }

  @POST
  @Path("/{id}/documento")
  @Consumes(MediaType.MULTIPART_FORM_DATA)
  @Operation(summary = "Adjuntar documento al trabajo")
  @ApiResponse(responseCode = "200", description = "Documento adjuntado")
  @ApiResponse(responseCode = "404", description = "Trabajo no encontrado")
  public Trabajo adjuntarDocumento(
      @PathParam("id") Long id,
      @Parameter(
              description = "Documento del trabajo (PDF)",
              required = true,
              content =
                  @Content(
                      mediaType = MediaType.APPLICATION_OCTET_STREAM,
                      schema = @Schema(type = "string", format = "binary")))
          @FormDataParam("file")
          java.io.InputStream file,
      @Parameter(hidden = true) @FormDataParam("file")
          org.glassfish.jersey.media.multipart.FormDataContentDisposition fileDetail)
      throws IOException {
    if (file == null) {
      throw new ar.edu.unlp.jyaa.grupo1.servicio.NegocioException("Debe adjuntar un archivo");
    }
    String nombre = fileDetail != null ? fileDetail.getFileName() : "documento.pdf";
    Trabajo trabajo = trabajoService.adjuntarDocumento(id, file, nombre);
    if (trabajo == null) {
      throw new NotFoundException("Trabajo no encontrado");
    }
    return trabajo;
  }
}
