package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import java.util.List;

public record UsuarioDTO(
    Long id,
    String email,
    String nombre,
    String apellido,
    List<String> roles,
    String rolActual,
    boolean activo,
    String categoriaInscripcion,
    String ejeTematicoEvaluador) {

  public static UsuarioDTO from(Usuario u) {
    return new UsuarioDTO(
        u.getId(),
        u.getEmail(),
        u.getNombre(),
        u.getApellido(),
        u.getRoles().stream().map(Rol::name).toList(),
        u.getRolActual() != null ? u.getRolActual().name() : null,
        u.isActivo(),
        u.getCategoriaInscripcion(),
        u.getEjeTematicoEvaluador());
  }
}
