package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.rest.dto.CongresoConfigUpdateRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.CertificadoService;
import ar.edu.unlp.jyaa.grupo1.servicio.CongresoService;
import ar.edu.unlp.jyaa.grupo1.web.dto.CongresoConfigDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.FinalizarCertificadosResultadoDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;

@Path("/congreso")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Congreso")
public class CongresoResource {

  @Inject private CongresoService congresoService;
  @Inject private CertificadoService certificadoService;

  @GET
  @Path("/config")
  @Operation(summary = "Configuración pública del congreso (programa y certificados)")
  public CongresoConfigDTO obtenerConfig() {
    return congresoService.obtenerConfig();
  }

  @PUT
  @Path("/config")
  @Operation(summary = "Actualizar configuración del congreso (admin u organizador para fecha límite)")
  public CongresoConfigDTO actualizarConfig(
      CongresoConfigUpdateRequest request, @Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    boolean esAdmin = auth.isAdmin();
    boolean esComite = auth.hasRole("ORGANIZADOR_CIENTIFICO");
    if (!esAdmin && !esComite) {
      throw new NotAuthorizedException("Solo administradores u organizador científico");
    }
    if (!esAdmin
        && (request.programaPublicado() != null
            || request.certificadosDisponiblesDesde() != null
            || request.congresoDesde() != null
            || request.congresoHasta() != null
            || request.inscripcionesDesde() != null
            || request.inscripcionesHasta() != null
            || request.evaluacionHasta() != null
            || request.nombre() != null
            || request.edicion() != null
            || request.sede() != null
            || (request.grupo() != null
                && !"ENVIO".equalsIgnoreCase(request.grupo().trim())))) {
      throw new NotAuthorizedException(
          "Solo administradores pueden modificar programa, certificados o ventanas del congreso");
    }
    return congresoService.actualizarConfig(request);
  }

  @POST
  @Path("/certificados/finalizar")
  @Operation(
      summary =
          "Finalizar congreso / habilitar certificados: setea fecha si falta, registra Certificado"
              + " para inscritos APROBADOS y evaluadores, y notifica por email/in-app")
  public FinalizarCertificadosResultadoDTO finalizarCertificados(
      @Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    if (!auth.isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
    return certificadoService.finalizarYHabilitar();
  }
}
