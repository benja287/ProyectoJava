package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.rest.dto.ActivoRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.RolesRequest;
import ar.edu.unlp.jyaa.grupo1.servicio.UsuarioService;
import ar.edu.unlp.jyaa.grupo1.web.dto.UsuarioDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.net.URI;
import java.util.List;

@Path("/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Usuarios")
public class UsuarioResource {

  @Inject private UsuarioService usuarioService;

  @GET
  @Operation(summary = "Listar usuarios")
  @ApiResponse(responseCode = "200", description = "Listado de usuarios")
  public List<UsuarioDTO> listar() {
    return usuarioService.listarTodos().stream().map(UsuarioDTO::from).toList();
  }

  @GET
  @Path("/{id}")
  @Operation(summary = "Buscar usuario por id")
  @ApiResponse(responseCode = "200", description = "Usuario encontrado")
  @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
  public UsuarioDTO buscarPorId(@PathParam("id") Long id) {
    Usuario usuario = usuarioService.buscarPorId(id);
    if (usuario == null) {
      throw new NotFoundException("Usuario no encontrado");
    }
    return UsuarioDTO.from(usuario);
  }

  @POST
  @Operation(summary = "Alta de usuario")
  @ApiResponse(responseCode = "201", description = "Usuario creado")
  public Response alta(Usuario usuario, @Context UriInfo uriInfo) {
    Usuario creado = usuarioService.alta(usuario);
    URI location = uriInfo.getAbsolutePathBuilder().path(creado.getId().toString()).build();
    return Response.created(location).entity(UsuarioDTO.from(creado)).build();
  }

  @PUT
  @Path("/{id}")
  @Operation(summary = "Modificar usuario")
  @ApiResponse(responseCode = "200", description = "Usuario actualizado")
  @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
  public UsuarioDTO modificar(@PathParam("id") Long id, Usuario datos) {
    Usuario actualizado = usuarioService.modificar(id, datos);
    if (actualizado == null) {
      throw new NotFoundException("Usuario no encontrado");
    }
    return UsuarioDTO.from(actualizado);
  }

  @DELETE
  @Path("/{id}")
  @Operation(summary = "Baja de usuario")
  @ApiResponse(responseCode = "204", description = "Usuario eliminado")
  @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
  public Response baja(@PathParam("id") Long id) {
    if (usuarioService.buscarPorId(id) == null) {
      throw new NotFoundException("Usuario no encontrado");
    }
    usuarioService.baja(id);
    return Response.noContent().build();
  }

  @PUT
  @Path("/{id}/roles")
  @Operation(summary = "Asignar roles a usuario")
  @ApiResponse(responseCode = "200", description = "Roles actualizados")
  @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
  public UsuarioDTO asignarRoles(@PathParam("id") Long id, RolesRequest request) {
    Usuario actualizado =
        usuarioService.asignarRoles(id, request.roles(), request.rolActual());
    if (actualizado == null) {
      throw new NotFoundException("Usuario no encontrado");
    }
    return UsuarioDTO.from(actualizado);
  }

  @PUT
  @Path("/{id}/activo")
  @Operation(summary = "Activar o desactivar usuario")
  @ApiResponse(responseCode = "200", description = "Estado actualizado")
  @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
  public UsuarioDTO setActivo(@PathParam("id") Long id, ActivoRequest request) {
    Usuario actualizado = usuarioService.setActivo(id, request.activo());
    if (actualizado == null) {
      throw new NotFoundException("Usuario no encontrado");
    }
    return UsuarioDTO.from(actualizado);
  }

  @PUT
  @Path("/{id}/promover-evaluador")
  @Operation(summary = "Promover usuario a evaluador")
  @ApiResponse(responseCode = "200", description = "Usuario promovido")
  @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
  public UsuarioDTO promoverEvaluador(@PathParam("id") Long id) {
    Usuario actualizado = usuarioService.promoverEvaluador(id);
    if (actualizado == null) {
      throw new NotFoundException("Usuario no encontrado");
    }
    return UsuarioDTO.from(actualizado);
  }
}
