package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import java.util.Optional;

public interface UsuarioDAO extends GenericDAO<Usuario> {

  Optional<Usuario> buscarPorEmail(String email);

  /** Alias de recuperarPorId para código que esperaba Optional. */
  default Optional<Usuario> buscarPorId(Long id) {
    return Optional.ofNullable(recuperarPorId(id));
  }
}
