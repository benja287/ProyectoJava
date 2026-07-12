package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import java.util.List;
import java.util.Optional;

public interface AsignacionEvaluacionDAO extends GenericDAO<AsignacionEvaluacion> {

  List<AsignacionEvaluacion> listarPorEvaluador(Long evaluadorId);

  List<AsignacionEvaluacion> listarPorEvaluadorPaginado(
      Long evaluadorId, boolean soloPendientes, int offset, int limit);

  long contarPorEvaluador(Long evaluadorId, boolean soloPendientes);

  long contarEvaluadasPorEvaluador(Long evaluadorId);

  long contarAprobadasPorEvaluador(Long evaluadorId);

  List<AsignacionEvaluacion> listarPorTrabajo(Long trabajoId);

  Optional<AsignacionEvaluacion> buscarActiva(Long trabajoId, Long evaluadorId);

  Optional<AsignacionEvaluacion> recuperarPorIdConDetalle(Long id);
}
