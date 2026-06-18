package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.Archivo;
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

@Path("/archivos")
@RequestScoped
@Tag(name = "Archivos")
public class ArchivoResource {

  @Inject private DocumentStorageService documentStorageService;

  @GET
  @Path("/{id}")
  @Operation(summary = "Descargar archivo almacenado en base de datos")
  @ApiResponse(responseCode = "200", description = "Archivo servido desde BLOB")
  @ApiResponse(responseCode = "404", description = "Archivo no encontrado")
  public Response descargar(@PathParam("id") Long id) {
    try {
      Archivo archivo = documentStorageService.obtener(id);
      return Response.ok(archivo.getContenido())
          .type(archivo.getContentType())
          .header(
              "Content-Disposition",
              "inline; filename=\"" + archivo.getNombreOriginal() + "\"")
          .build();
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }
}
