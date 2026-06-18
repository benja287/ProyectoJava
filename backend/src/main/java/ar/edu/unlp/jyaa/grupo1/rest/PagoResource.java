package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.Pago;
import ar.edu.unlp.jyaa.grupo1.rest.dto.ComprobanteUploadForm;
import ar.edu.unlp.jyaa.grupo1.rest.dto.PagoRegistroRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.ValidacionPagoRequest;
import ar.edu.unlp.jyaa.grupo1.servicio.PagoService;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaPagosDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
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
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.io.IOException;
import java.net.URI;
import java.util.Map;
import org.glassfish.jersey.media.multipart.FormDataParam;

@Path("/pagos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Pagos")
public class PagoResource {

  @Inject private PagoService pagoService;

  @GET
  @Path("/pendientes")
  @Operation(summary = "Listar pagos pendientes")
  @ApiResponse(responseCode = "200", description = "Listado paginado de pagos pendientes")
  public PaginaPagosDTO listarPendientes(
      @QueryParam("page") @DefaultValue("1") int page,
      @QueryParam("size") @DefaultValue("20") int size) {
    return pagoService.listarPendientes(page, size);
  }

  @GET
  @Path("/usuario/{usuarioId}/estado")
  @Operation(summary = "Consultar estado de pago del participante")
  @ApiResponse(responseCode = "200", description = "Estado Pendiente/Aprobado/Rechazado")
  public Pago consultarEstadoPorUsuario(@PathParam("usuarioId") Long usuarioId) {
    return pagoService.consultarEstadoPorUsuario(usuarioId);
  }

  @GET
  @Path("/{id}")
  @Operation(summary = "Consultar pago por id")
  @ApiResponse(responseCode = "200", description = "Pago encontrado")
  @ApiResponse(responseCode = "404", description = "Pago no encontrado")
  public Pago consultar(@PathParam("id") Long id) {
    try {
      return pagoService.consultarPorId(id);
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @POST
  @Operation(summary = "Registrar pago")
  @ApiResponse(responseCode = "201", description = "Pago registrado")
  @ApiResponse(responseCode = "400", description = "Error de validación")
  public Response registrar(PagoRegistroRequest request, @Context UriInfo uriInfo) {
    Pago pago = pagoService.registrarPago(request.usuarioId(), request.pago());
    URI location = uriInfo.getAbsolutePathBuilder().path(pago.getId().toString()).build();
    return Response.created(location).entity(pago).build();
  }

  @PUT
  @Path("/{id}/validacion")
  @Operation(summary = "Aprobar o rechazar pago")
  @ApiResponse(responseCode = "200", description = "Pago validado")
  @ApiResponse(responseCode = "404", description = "Pago no encontrado")
  public Map<String, Object> validar(
      @PathParam("id") Long id, ValidacionPagoRequest request) {
    PagoService.ValidacionPagoResult result =
        pagoService.validarPago(
            id, request.aprobar(), request.motivoRechazo(), request.montoAjustado());
    if (result == null) {
      throw new NotFoundException("Pago no encontrado");
    }
    return Map.of("pago", result.pago(), "mensaje", result.mensaje());
  }

  @POST
  @Path("/{id}/comprobante")
  @Consumes(MediaType.MULTIPART_FORM_DATA)
  @Operation(
      summary = "Adjuntar comprobante de pago",
      requestBody =
          @RequestBody(
              required = true,
              content =
                  @Content(
                      mediaType = MediaType.MULTIPART_FORM_DATA,
                      schema = @Schema(implementation = ComprobanteUploadForm.class))))
  @ApiResponse(responseCode = "200", description = "Comprobante registrado")
  public Pago adjuntarComprobante(
      @PathParam("id") Long id,
      @FormDataParam("file") java.io.InputStream file,
      @FormDataParam("file")
          org.glassfish.jersey.media.multipart.FormDataContentDisposition fileDetail)
      throws IOException {
    if (file == null) {
      throw new ar.edu.unlp.jyaa.grupo1.servicio.NegocioException("Debe adjuntar un comprobante");
    }
    String nombre = fileDetail != null ? fileDetail.getFileName() : "comprobante.pdf";
    return pagoService.adjuntarComprobante(id, file, nombre);
  }
}
