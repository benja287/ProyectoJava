package ar.edu.unlp.jyaa.grupo1.dao;

import java.util.List;

/**
 * Operaciones ABM exigidas por la tercera entrega (alta, baja, modificación, recuperación).
 */
public interface GenericDAO<T> {

  /** Alta — persist de entidad nueva. */
  T alta(T entidad);

  /** Baja — elimina por id. */
  void baja(Long id);

  /** Modificación — merge de entidad existente. */
  T modificar(T entidad);

  /** Recuperación por clave primaria. */
  T recuperarPorId(Long id);

  /** Recuperación de todas las filas. */
  List<T> listarTodos();
}
