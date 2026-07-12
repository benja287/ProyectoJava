package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.dao.filtro.TrabajoFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import java.util.List;
import java.util.Optional;

public interface TrabajoDAO extends GenericDAO<Trabajo> {

  List<Trabajo> listarPorAutor(Long autorId);

  List<Trabajo> listarPaginado(int offset, int limit);

  long contar();

  List<Trabajo> listarPorAutorPaginado(Long autorId, int offset, int limit);

  long contarPorAutor(Long autorId);

  List<Trabajo> listarFiltrado(TrabajoFiltro filtro, int offset, int limit);

  long contarFiltrado(TrabajoFiltro filtro);

  List<Trabajo> listarFiltradoComite(TrabajoFiltro filtro, int offset, int limit);

  long contarFiltradoComite(TrabajoFiltro filtro);

  Optional<Trabajo> recuperarPorIdConAutor(Long id);
}
