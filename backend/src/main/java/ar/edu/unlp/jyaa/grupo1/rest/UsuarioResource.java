package ar.edu.unlp.jyaa.grupo1.rest;

import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import ar.edu.unlp.jyaa.grupo1.rest.dto.ActivoRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.ActualizarPerfilRequest;
import ar.edu.unlp.jyaa.grupo1.rest.dto.RolesRequest;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.UsuarioFiltro;
import ar.edu.unlp.jyaa.grupo1.security.AuthenticatedUser;
import ar.edu.unlp.jyaa.grupo1.servicio.UsuarioService;
import ar.edu.unlp.jyaa.grupo1.web.dto.PaginaUsuariosDTO;
import ar.edu.unlp.jyaa.grupo1.web.dto.UsuarioDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
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
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import java.net.URI;

@Path("/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequestScoped
@Tag(name = "Usuarios")
public class UsuarioResource {

  @Inject private UsuarioService usuarioService;
  @Inject private ar.edu.unlp.jyaa.grupo1.servicio.EvaluadorEjeService evaluadorEjeService;
  @Inject private ar.edu.unlp.jyaa.grupo1.servicio.SolicitudEvaluadorService solicitudEvaluadorService;

  @GET
  @Operation(summary = "Listar usuarios")
  @ApiResponse(responseCode = "200", description = "Listado paginado de usuarios")
  public PaginaUsuariosDTO listar(
      @QueryParam("page") @DefaultValue("1") int page,
      @QueryParam("size") @DefaultValue("20") int size,
      @QueryParam("apellido") String apellido,
      @QueryParam("nombre") String nombre,
      @QueryParam("email") String email,
      @QueryParam("esEvaluador") Boolean esEvaluador,
      @QueryParam("ejeTematico") String ejeTematico,
      @QueryParam("activo") Boolean activo,
      @Context ContainerRequestContext ctx) {
    UsuarioFiltro filtro =
        new UsuarioFiltro(apellido, nombre, email, esEvaluador, ejeTematico, activo);
    return usuarioService.listar(page, size, filtro, AuthenticatedUser.from(ctx));
  }

  @GET
  @Path("/me")
  @Operation(summary = "Perfil del usuario autenticado")
  public UsuarioDTO miPerfil(@Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    Usuario usuario = usuarioService.buscarPorId(auth.userId());
    if (usuario == null) {
      throw new NotFoundException("Usuario no encontrado");
    }
    return evaluadorEjeService.toDto(usuario);
  }

  @PUT
  @Path("/me")
  @Operation(
      summary = "Actualizar perfil propio",
      description =
          "Permite cambiar nombre, apellido, email y contraseña. No modifica roles, activo,"
              + " categoría de inscripción ni eje de evaluador.")
  public UsuarioDTO actualizarMiPerfil(
      ActualizarPerfilRequest request, @Context ContainerRequestContext ctx) {
    AuthenticatedUser auth = AuthenticatedUser.from(ctx);
    return evaluadorEjeService.toDto(usuarioService.actualizarPerfilPropio(auth.userId(), request));
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
    return evaluadorEjeService.toDto(usuario);
  }

  @POST
  @Operation(
      summary = "Alta de usuario",
      description =
          "Staff: alta corta con roles. Si incluye ASISTENTE, exige datos de certificado +"
              + " categoría/filiación y crea inscripción + pago en efectivo aprobados.")
  @ApiResponse(responseCode = "201", description = "Usuario creado")
  public Response alta(
      ar.edu.unlp.jyaa.grupo1.rest.dto.UsuarioAltaRequest request,
      @Context UriInfo uriInfo,
      @Context ContainerRequestContext ctx) {
    Usuario creado = usuarioService.alta(request, AuthenticatedUser.from(ctx));
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
  @Path("/{id}/promover-autor")
  @Operation(summary = "Habilitar rol autor para un asistente con trabajos aprobados")
  public UsuarioDTO promoverAutor(
      @PathParam("id") Long id, @Context ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).isAdmin()) {
      throw new NotAuthorizedException("Solo administradores");
    }
    try {
      Usuario actualizado = usuarioService.promoverAutor(id);
      if (actualizado == null) {
        throw new NotFoundException("Usuario no encontrado");
      }
      return UsuarioDTO.from(actualizado);
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
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

  @PUT
  @Path("/{id}/evaluador-eje")
  @Operation(
      summary = "Asignar evaluador a un eje temático con cupo",
      description =
          "Crea o reinicia el cupo del eje (capacidad opcional; default 5). Se pueden asignar"
              + " varios ejes al mismo usuario.")
  public UsuarioDTO asignarEvaluadorEje(
      @PathParam("id") Long id,
      ar.edu.unlp.jyaa.grupo1.rest.dto.EvaluadorEjeRequest request,
      @Context ContainerRequestContext ctx) {
    requireGestionEvaluadores(ctx);
    try {
      return evaluadorEjeService.toDto(
          evaluadorEjeService.asignarEvaluadorAEje(
              id, request.ejeTematico(), request.capacidad()));
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @PUT
  @Path("/{id}/evaluador-eje/cupo/reiniciar")
  @Operation(summary = "Reiniciar cupo restante de un eje (= capacidad máxima)")
  public UsuarioDTO reiniciarCupoEvaluador(
      @PathParam("id") Long id,
      ar.edu.unlp.jyaa.grupo1.rest.dto.EvaluadorEjeRequest request,
      @Context ContainerRequestContext ctx) {
    requireGestionEvaluadores(ctx);
    try {
      return evaluadorEjeService.toDto(
          evaluadorEjeService.reiniciarCupo(id, request.ejeTematico()));
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  @DELETE
  @Path("/{id}/evaluador-eje")
  @Operation(
      summary = "Quitar evaluador del eje (o de todos)",
      description =
          "Sin query eje: quita todos los cupos, el rol EVALUADOR y revoca solicitudes aprobadas."
              + " Con ?eje=...: quita solo ese eje.")
  public UsuarioDTO quitarEvaluadorEje(
      @PathParam("id") Long id,
      @QueryParam("eje") String eje,
      @Context ContainerRequestContext ctx) {
    requireGestionEvaluadores(ctx);
    try {
      if (eje != null && !eje.isBlank()) {
        Usuario actualizado = evaluadorEjeService.quitarEvaluadorDeUnEje(id, eje);
        // Si no quedan cupos activos, retirar rol y revocar solicitud aprobada.
        if (evaluadorEjeService.listarCuposDto(id).isEmpty()) {
          actualizado = evaluadorEjeService.quitarEvaluadorDeEje(id);
          solicitudEvaluadorService.revocarAprobadasPorRetiroDeRol(id);
        }
        return evaluadorEjeService.toDto(actualizado);
      }
      Usuario actualizado = evaluadorEjeService.quitarEvaluadorDeEje(id);
      solicitudEvaluadorService.revocarAprobadasPorRetiroDeRol(id);
      return evaluadorEjeService.toDto(actualizado);
    } catch (ar.edu.unlp.jyaa.grupo1.servicio.NegocioException e) {
      throw new NotFoundException(e.getMessage());
    }
  }

  private void requireGestionEvaluadores(ContainerRequestContext ctx) {
    if (!AuthenticatedUser.from(ctx).canGestionarEvaluadoresEje()) {
      throw new NotAuthorizedException("Solo comité académico o administrador");
    }
  }
}
