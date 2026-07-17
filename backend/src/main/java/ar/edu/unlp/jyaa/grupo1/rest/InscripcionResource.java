package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.rest.dto.ValidacionInscripcionRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.InscripcionService;
import ar.edu.unlp.jyaa.grupo1.web.dto.EstadoInscripcionParticipanteDTO;
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
  @Operation(summary = "Crear inscripción al congreso con pago")
  @ApiResponse(responseCode = "201", description = "Inscripción creada")
  public Response crear(
      @FormDataParam("categoria") String categoria,
      @FormDataParam("institucion") String institucion,
      @FormDataParam("provincia") String provincia,
      @FormDataParam("requiereFactura") String requiereFactura,
      @FormDataParam("metodoPago") String metodoPago,
      @FormDataParam("monto") String monto,
      @FormDataParam("tiposParticipacion") String tiposParticipacion,
      @FormDataParam("participacionOtro") String participacionOtro,
      @FormDataParam("facturaRazonSocial") String facturaRazonSocial,
      @FormDataParam("facturaCuit") String facturaCuit,
      @FormDataParam("facturaCondicionIva") String facturaCondicionIva,
      @FormDataParam("facturaDomicilioFiscal") String facturaDomicilioFiscal,
      @FormDataParam("telefono") String telefono,
      @FormDataParam("tipoIdentificacion") String tipoIdentificacion,
      @FormDataParam("numeroIdentificacion") String numeroIdentificacion,
      @FormDataParam("nacionalidad") String nacionalidad,
      @FormDataParam("certificado") InputStream certificado,
      @FormDataParam("certificado")
          org.glassfish.jersey.media.multipart.FormDataContentDisposition certificadoDetail,
      @FormDataParam("comprobante") InputStream comprobante,
      @FormDataParam("comprobante")
          org.glassfish.jersey.media.multipart.FormDataContentDisposition comprobanteDetail,
      @Context ContainerRequestContext ctx,
      @Context UriInfo uriInfo) {
    InscripcionCongresoDTO creada =
        inscripcionService.crear(
            AuthenticatedUser.from(ctx),
            categoria,
            institucion,
            provincia,
            parseBoolean(requiereFactura),
            metodoPago,
            parseMonto(monto),
            tiposParticipacion,
            participacionOtro,
            facturaRazonSocial,
            facturaCuit,
            facturaCondicionIva,
            facturaDomicilioFiscal,
            telefono,
            tipoIdentificacion,
            numeroIdentificacion,
            nacionalidad,
            certificado,
            certificadoDetail != null ? certificadoDetail.getFileName() : "certificado.pdf",
            comprobante,
            comprobanteDetail != null ? comprobanteDetail.getFileName() : "comprobante.pdf");
    URI location = uriInfo.getAbsolutePathBuilder().path(creada.id().toString()).build();
    return Response.created(location).entity(creada).build();
  }

  @GET
  @Path("/reglas-categorias")
  @Operation(summary = "Reglas de inscripción por categoría")
  @ApiResponse(responseCode = "200", description = "Listado de reglas")
  public java.util.List<ar.edu.unlp.jyaa.grupo1.web.dto.ReglasCategoriaDTO> reglasCategorias() {
    return inscripcionService.listarReglasCategorias();
  }

  @GET
  @Path("/mis-datos")
  @Operation(summary = "Estado de inscripción del participante autenticado")
  @ApiResponse(responseCode = "200", description = "Estado de inscripción")
  public EstadoInscripcionParticipanteDTO misDatos(@Context ContainerRequestContext ctx) {
    return inscripcionService.estadoParticipante(AuthenticatedUser.from(ctx));
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

  @GET
  @Path("/{id}")
  @Operation(summary = "Consultar inscripción por id (admin)")
  @ApiResponse(responseCode = "200", description = "Inscripción encontrada")
  @ApiResponse(responseCode = "404", description = "Inscripción no encontrada")
  public InscripcionCongresoDTO obtener(
      @PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    InscripcionCongresoDTO dto = inscripcionService.obtener(id, AuthenticatedUser.from(ctx));
    if (dto == null) {
      throw new NotFoundException("Inscripción no encontrada");
    }
    return dto;
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

  private static Double parseMonto(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    try {
      return Double.parseDouble(value.trim().replace(',', '.'));
    } catch (NumberFormatException e) {
      throw new ar.edu.unlp.jyaa.grupo1.servicio.NegocioException("Monto inválido: " + value);
    }
  }
}
