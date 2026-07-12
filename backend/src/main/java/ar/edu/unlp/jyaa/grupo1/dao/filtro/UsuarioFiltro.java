package ar.edu.unlp.jyaa.grupo1.dao.filtro;

/**
 * Filtros opcionales para listado de usuarios.
 *
 * @param soloEvaluadores {@code true} = con eje asignado; {@code false} = sin eje; {@code null} =
 *     todos
 * @param ejeTematicoEvaluador coincidencia exacta del eje (si no es null/blank)
 * @param activo si no es null, filtra por u.activo
 */
public record UsuarioFiltro(
    String apellido,
    String nombre,
    String email,
    Boolean soloEvaluadores,
    String ejeTematicoEvaluador,
    Boolean activo) {

  /** Compatibilidad con listados que solo usan apellido/nombre/email. */
  public UsuarioFiltro(String apellido, String nombre, String email) {
    this(apellido, nombre, email, null, null, null);
  }
}
