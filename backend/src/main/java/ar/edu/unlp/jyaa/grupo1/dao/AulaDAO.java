package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.Aula;
import java.util.List;

public interface AulaDAO extends GenericDAO<Aula> {

  List<Aula> listarTodas();

  List<Aula> listarActivas();
}
