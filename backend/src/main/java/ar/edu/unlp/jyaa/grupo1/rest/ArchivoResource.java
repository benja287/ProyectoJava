package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.servicio.DocumentStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;
import java.io.IOException;
import java.nio.file.Files;

@Path("/archivos")
@RequestScoped
@Tag(name = "Archivos")
public class ArchivoResource {

  private final DocumentStorageService documentStorageService;

  @Inject
  public ArchivoResource(DocumentStorageService documentStorageService) {
    this.documentStorageService = documentStorageService;
  }

  @GET
  @Path("/{carpeta}/{nombre}")
  @Operation(summary = "Descargar archivo almacenado")
  @ApiResponse(responseCode = "200", description = "Archivo servido")
  @ApiResponse(responseCode = "404", description = "Archivo no encontrado")
  public Response descargar(
      @PathParam("carpeta") String carpeta, @PathParam("nombre") String nombre)
      throws IOException {
    try {
      java.nio.file.Path path = documentStorageService.resolver(carpeta, nombre);
      String contentType = Files.probeContentType(path);
      if (contentType == null) {
        contentType = "application/octet-stream";
      }
      return Response.ok(Files.newInputStream(path))
          .type(contentType)
          .header("Content-Disposition", "inline; filename=\"" + nombre + "\"")
          .build();
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }
}
