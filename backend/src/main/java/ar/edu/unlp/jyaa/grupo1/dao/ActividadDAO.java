package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import java.time.LocalDateTime;
import java.util.List;

public interface ActividadDAO extends GenericDAO<Actividad> {

  List<Actividad> buscarConflictos(String sala, LocalDateTime inicio, LocalDateTime fin, Long excluirId);
}
