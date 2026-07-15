package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.rest.dto.ArancelesConfigUpdateRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.ArancelesService;
import ar.edu.unlp.jyaa.grupo1.web.dto.ArancelesConfigDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import java.io.InputStream;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;

@Path("/congreso/aranceles")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Aranceles de inscripción")
public class ArancelesResource {

  @Inject private ArancelesService arancelesService;

  @GET
  @Operation(summary = "Configuración de aranceles (precios y datos de pago)")
  public ArancelesConfigDTO obtener(@Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    return arancelesService.obtener(auth.isAdmin());
  }

  @PUT
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Guardar/publicar aranceles (solo admin)")
  public ArancelesConfigDTO guardar(
      ArancelesConfigUpdateRequest request, @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return arancelesService.guardar(request);
  }

  @POST
  @Path("/qr")
  @Consumes(MediaType.MULTIPART_FORM_DATA)
  @Operation(summary = "Subir imagen QR de pago (solo admin)")
  public ArancelesConfigDTO subirQr(
      @FormDataParam("archivo") InputStream archivo,
      @FormDataParam("archivo") FormDataContentDisposition meta,
      @Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    String nombre = meta != null ? meta.getFileName() : "qr-pago.png";
    return arancelesService.subirQr(archivo, nombre);
  }

  @DELETE
  @Path("/qr")
  @Operation(summary = "Quitar QR de pago (solo admin)")
  public ArancelesConfigDTO quitarQr(@Context ContainerRequestContext ctx) {
    requireAdmin(ctx);
    return arancelesService.quitarQr();
  }

  private static void requireAdmin(ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
  }
}
