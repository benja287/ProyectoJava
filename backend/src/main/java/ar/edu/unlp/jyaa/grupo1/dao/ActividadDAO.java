package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.dao.filtro.ActividadFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoActividad;
import java.time.LocalDateTime;
import java.util.List;

public interface ActividadDAO extends GenericDAO<Actividad> {

  List<Actividad> buscarConflictos(String sala, LocalDateTime inicio, LocalDateTime fin, Long excluirId);

  List<Actividad> buscarSolapamientoTipo(
      TipoActividad tipo, LocalDateTime inicio, LocalDateTime fin, Long excluirId);

  List<Actividad> listarPaginado(int offset, int limit);

  List<Actividad> listarFiltrado(ActividadFiltro filtro, int offset, int limit);

  long contar();

  long contarFiltrado(ActividadFiltro filtro);
}
