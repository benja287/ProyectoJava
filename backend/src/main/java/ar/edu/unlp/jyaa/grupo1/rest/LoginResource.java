package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.dao.UsuarioDAO;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.rest.dto.LoginRequest;
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
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;
import java.util.Optional;

@Path("/login")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Login")
public class LoginResource {

  private final UsuarioDAO usuarioDAO;

  @Inject
  public LoginResource(UsuarioDAO usuarioDAO) {
    this.usuarioDAO = usuarioDAO;
  }

  @POST
  @Operation(summary = "Iniciar sesión")
  @ApiResponse(responseCode = "200", description = "Credenciales válidas")
  @ApiResponse(responseCode = "401", description = "Credenciales inválidas")
  public Response login(LoginRequest request) {
    String email = request.email() != null ? request.email().trim().toLowerCase() : "";
    Optional<Usuario> opt = usuarioDAO.buscarPorEmail(email);
    if (opt.isEmpty()) {
      return Response.status(Response.Status.UNAUTHORIZED)
          .entity(Map.of("error", "Credenciales inválidas"))
          .build();
    }
    Usuario usuario = opt.get();
    if (!usuario.isActivo()) {
      return Response.status(Response.Status.FORBIDDEN)
          .entity(Map.of("error", "Cuenta deshabilitada", "accountDisabled", true))
          .build();
    }
    if (!usuario.getPassword().equals(request.password())) {
      return Response.status(Response.Status.UNAUTHORIZED)
          .entity(Map.of("error", "Credenciales inválidas"))
          .build();
    }
    return Response.ok(UsuarioDTO.from(usuario)).build();
  }
}
