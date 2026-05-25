package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import java.util.List;

public interface TrabajoDAO extends GenericDAO<Trabajo> {

  List<Trabajo> listarPorAutor(Long autorId);
}
