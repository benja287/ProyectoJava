package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.ArancelCategoria;
import java.util.List;
import java.util.Optional;

public interface ArancelCategoriaDAO extends GenericDAO<ArancelCategoria> {

  List<ArancelCategoria> listarTodos();

  Optional<ArancelCategoria> buscarPorCategoria(String categoria);
}
