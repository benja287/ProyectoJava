package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.DocumentStorageService;
import ar.edu.unlp.jyaa.grupo1.web.dto.LimpiezaArchivoResultDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;

@Path("/admin/archivos")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Admin — Archivos almacenados")
public class ArchivoAdminResource {

  @Inject private DocumentStorageService documentStorageService;

  @GET
  @Path("/huerfanos/resumen")
  @Operation(
      summary = "Cantidad de PDFs/comprobantes sin referencia (admin)",
      description =
          "Archivos en la tabla archivos que ya no están vinculados a trabajos, pagos,"
              + " inscripciones ni circulares.")
  public LimpiezaArchivoResultDTO resumenHuerfanos(@Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    long n = documentStorageService.contarArchivosHuerfanos();
    return new LimpiezaArchivoResultDTO(
        0, n, n == 0 ? "No hay archivos huérfanos." : n + " archivo(s) huérfano(s) detectado(s).");
  }

  @DELETE
  @Path("/huerfanos")
  @Operation(summary = "Eliminar archivos huérfanos de la base (admin)")
  public LimpiezaArchivoResultDTO limpiarHuerfanos(@Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    int eliminados = documentStorageService.eliminarArchivosHuerfanos();
    long restantes = documentStorageService.contarArchivosHuerfanos();
    String mensaje =
        eliminados == 0
            ? "No había archivos huérfanos para eliminar."
            : "Se eliminaron " + eliminados + " archivo(s) huérfano(s).";
    return new LimpiezaArchivoResultDTO(eliminados, restantes, mensaje);
  }

  private static void requireAdmin(ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
  }
}
