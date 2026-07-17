package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.dao.filtro.UsuarioFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import java.util.List;
import java.util.Optional;

public interface UsuarioDAO extends GenericDAO<Usuario> {

  List<Usuario> listarPaginado(int offset, int limit);

  long contar();

  List<Usuario> listarFiltrado(UsuarioFiltro filtro, int offset, int limit);

  long contarFiltrado(UsuarioFiltro filtro);

  Optional<Usuario> buscarPorEmail(String email);

  /** Usuarios con excepción de cupo de envío de trabajos. */
  List<Usuario> listarConExcepcionCupoEnvio(int offset, int limit);

  long contarConExcepcionCupoEnvio();

  /** Consulta liviana: solo el flag activo (sin cargar roles ni password). */
  Optional<Boolean> isActivoById(Long id);

  /** Alias de recuperarPorId para código que esperaba Optional. */
  default Optional<Usuario> buscarPorId(Long id) {
    return Optional.ofNullable(recuperarPorId(id));
  }

  /** Evaluadores con eje temático asignado (excluye opcionalmente un usuario). */
  long contarEvaluadoresPorEje(String ejeTematico, Long excluirUsuarioId);

  void flush();
}
