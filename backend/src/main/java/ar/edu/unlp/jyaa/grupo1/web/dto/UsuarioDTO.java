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
    String telefono,
    String tipoIdentificacion,
    String numeroIdentificacion,
    String nacionalidad,
    String ejeTematicoEvaluador,
    List<EvaluadorEjeCupoDTO> cuposEje) {

  public static UsuarioDTO from(Usuario u) {
    return from(u, List.of());
  }

  public static UsuarioDTO from(Usuario u, List<EvaluadorEjeCupoDTO> cuposEje) {
    return new UsuarioDTO(
        u.getId(),
        u.getEmail(),
        u.getNombre(),
        u.getApellido(),
        u.getRoles().stream().map(Rol::name).toList(),
        u.getRolActual() != null ? u.getRolActual().name() : null,
        u.isActivo(),
        u.getCategoriaInscripcion(),
        u.getTelefono(),
        u.getTipoIdentificacion(),
        u.getNumeroIdentificacion(),
        u.getNacionalidad(),
        u.getEjeTematicoEvaluador(),
        cuposEje != null ? cuposEje : List.of());
  }
}
