package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.CertificadoService;
import ar.edu.unlp.jyaa.grupo1.web.dto.MisCertificadosDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;

@Path("/certificados")
@Produces(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Certificados")
public class CertificadoResource {

  @Inject private CertificadoService certificadoService;

  @GET
  @Path("/mios")
  @Operation(
      summary = "Certificados del usuario autenticado",
      description =
          "Lista asistencia, evaluador, presentación de trabajos programados y participación"
              + " por agenda personal (si corresponde).")
  public MisCertificadosDTO mios(@Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    return certificadoService.listarMios(auth.userId());
  }
}
