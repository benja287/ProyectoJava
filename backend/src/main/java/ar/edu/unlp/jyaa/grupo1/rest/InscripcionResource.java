package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.rest.dto.ValidacionInscripcionRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.InscripcionService;
import ar.edu.unlp.jyaa.grupo1.servicio.NegocioException;
import ar.edu.unlp.jyaa.grupo1.web.dto.InscripcionCongresoDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaInscripcionesDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
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
import java.io.InputStream;
import java.net.URI;
import org.glassfish.jersey.media.multipart.FormDataParam;

@Path("/inscripciones")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Inscripciones")
public class InscripcionResource {

  @Inject private InscripcionService inscripcionService;

  @POST
  @Consumes(MediaType.MULTIPART_FORM_DATA)
  @Operation(summary = "Crear inscripción al congreso")
  @ApiResponse(responseCode = "201", description = "Inscripción creada")
  public Response crear(
      @FormDataParam("categoria") String categoria,
      @FormDataParam("institucion") String institucion,
      @FormDataParam("provincia") String provincia,
      @FormDataParam("requiereFactura") String requiereFactura,
      @FormDataParam("certificado") InputStream certificado,
      @FormDataParam("certificado")
          org.glassfish.jersey.media.multipart.FormDataContentDisposition certificadoDetail,
      @Context ContainerRequestContext ctx,
      @Context UriInfo uriInfo) {
    boolean factura = parseBoolean(requiereFactura);
    String nombreArchivo =
        certificadoDetail != null ? certificadoDetail.getFileName() : "certificado.pdf";
    InscripcionCongresoDTO creada =
        inscripcionService.crear(
            AuthenticatedUser.from(ctx),
            categoria,
            institucion,
            provincia,
            factura,
            certificado,
            nombreArchivo);
    URI location = uriInfo.getAbsolutePathBuilder().path(creada.id().toString()).build();
    return Response.created(location).entity(creada).build();
  }

  @GET
  @Path("/mis-datos")
  @Operation(summary = "Consultar la inscripción del usuario autenticado")
  @ApiResponse(responseCode = "200", description = "Inscripción encontrada")
  @ApiResponse(responseCode = "404", description = "Sin inscripción")
  public InscripcionCongresoDTO misDatos(@Context ContainerRequestContext ctx) {
    try {
      return inscripcionService.misDatos(AuthenticatedUser.from(ctx));
    } catch (NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @GET
  @Operation(summary = "Listar inscripciones (admin)")
  @ApiResponse(responseCode = "200", description = "Listado paginado")
  public PaginaInscripcionesDTO listar(
      @QueryParam("page") @DefaultValue("1") int page,
      @QueryParam("size") @DefaultValue("20") int size,
      @QueryParam("estado") String estado,
      @QueryParam("categoria") String categoria,
      @Context ContainerRequestContext ctx) {
    var filtro = InscripcionService.parseFiltro(estado, categoria);
    return inscripcionService.listar(page, size, filtro, AuthenticatedUser.from(ctx));
  }

  @PUT
  @Path("/{id}/validar")
  @Consumes(MediaType.APPLICATION_JSON)
  @Operation(summary = "Aprobar o rechazar inscripción (admin)")
  @ApiResponse(responseCode = "200", description = "Inscripción validada")
  @ApiResponse(responseCode = "404", description = "Inscripción no encontrada")
  public InscripcionCongresoDTO validar(
      @PathParam("id") Long id,
      ValidacionInscripcionRequest request,
      @Context ContainerRequestContext ctx) {
    InscripcionCongresoDTO actualizada =
        inscripcionService.validar(
            id, request.aprobar(), request.motivoRechazo(), AuthenticatedUser.from(ctx));
    if (actualizada == null) {
      throw new NotFoundException("Inscripción no encontrada");
    }
    return actualizada;
  }

  private static boolean parseBoolean(String value) {
    if (value == null) {
      return false;
    }
    return "true".equalsIgnoreCase(value.trim()) || "1".equals(value.trim());
  }
}
