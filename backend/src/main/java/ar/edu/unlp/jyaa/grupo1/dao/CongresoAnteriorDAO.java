package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.CongresoAnterior;
import java.util.List;

public interface CongresoAnteriorDAO extends GenericDAO<CongresoAnterior> {

  List<CongresoAnterior> listarOrdenados();

  long contar();
}
