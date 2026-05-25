package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.Circular;
import java.util.List;

public interface CircularDAO extends GenericDAO<Circular> {

  List<Circular> listarPublicadas();
}
