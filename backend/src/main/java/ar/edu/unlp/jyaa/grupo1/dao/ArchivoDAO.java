package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.Archivo;
import java.util.List;

public interface ArchivoDAO extends GenericDAO<Archivo> {

  List<Long> listarIdsHuerfanos();

  int eliminarPorIds(List<Long> ids);
}
