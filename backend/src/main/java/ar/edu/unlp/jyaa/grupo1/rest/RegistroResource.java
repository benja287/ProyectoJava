package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.rest.dto.RegistroParticipanteRequest;
import ar.edu.unlp.jyaa.grupo1.servicio.UsuarioService;
import ar.edu.unlp.jyaa.grupo1.web.dto.UsuarioDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.net.URI;

@Path("/registro")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Registro")
public class RegistroResource {

  @Inject private UsuarioService usuarioService;

  @POST
  @Operation(summary = "Registrar participante")
  @ApiResponse(responseCode = "201", description = "Participante registrado")
  @ApiResponse(responseCode = "400", description = "Error de validación")
  public Response registrarParticipante(RegistroParticipanteRequest request, @Context UriInfo uriInfo) {
    Usuario usuario = new Usuario();
    usuario.setNombre(request.nombre());
    usuario.setApellido(request.apellido());
    usuario.setEmail(request.email());
    usuario.setPassword(request.password());
    Usuario creado = usuarioService.registrarParticipante(usuario, request.categoria());
    URI location =
        uriInfo.getBaseUriBuilder().path("usuarios").path(creado.getId().toString()).build();
    return Response.created(location).entity(UsuarioDTO.from(creado)).build();
  }
}
