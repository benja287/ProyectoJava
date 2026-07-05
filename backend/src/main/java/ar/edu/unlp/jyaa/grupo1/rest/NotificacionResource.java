package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.rest.dto.EnviarNotificacionRequest;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.NegocioException;
import ar.edu.unlp.jyaa.grupo1.servicio.NotificacionService;
import ar.edu.unlp.jyaa.grupo1.web.dto.NotificacionDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotAuthorizedException;
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
import java.util.List;
import java.util.Map;

@Path("/notificaciones")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Notificaciones")
public class NotificacionResource {

  @Inject private NotificacionService notificacionService;

  @GET
  @Operation(summary = "Listar notificaciones del usuario autenticado")
  public List<NotificacionDTO> listar(
      @QueryParam("page") @DefaultValue("1") int page,
      @QueryParam("size") @DefaultValue("30") int size,
      @Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    return notificacionService.listarPorUsuario(auth.userId(), page, size);
  }

  @GET
  @Path("/no-leidas")
  @Operation(summary = "Cantidad de notificaciones no leídas")
  public Map<String, Long> contarNoLeidas(@Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    return Map.of("total", notificacionService.contarNoLeidas(auth.userId()));
  }

  @PUT
  @Path("/{id}/leida")
  @Operation(summary = "Marcar notificación como leída")
  public Response marcarLeida(@PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    notificacionService.marcarLeida(id, auth.userId());
    return Response.noContent().build();
  }

  @PUT
  @Path("/marcar-todas-leidas")
  @Operation(summary = "Marcar todas las notificaciones como leídas")
  public Response marcarTodasLeidas(@Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    notificacionService.marcarTodasLeidas(auth.userId());
    return Response.noContent().build();
  }

  @POST
  @Path("/enviar")
  @Operation(summary = "Enviar notificación (admin): a todos o por rol")
  public Map<String, Object> enviar(
      EnviarNotificacionRequest request, @Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    if (!auth.isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
    int enviadas;
    if (request.rol() == null || request.rol().isBlank() || "TODOS".equalsIgnoreCase(request.rol())) {
      enviadas =
          notificacionService.enviarATodos(
              request.asunto(), request.mensaje(), auth.userId());
    } else {
      Rol rol;
      try {
        rol = Rol.valueOf(request.rol().trim().toUpperCase());
      } catch (IllegalArgumentException e) {
        throw new NegocioException("Rol inválido: " + request.rol());
      }
      enviadas =
          notificacionService.enviarPorRol(
              rol, request.asunto(), request.mensaje(), auth.userId());
    }
    return Map.of("enviadas", enviadas);
  }
}
