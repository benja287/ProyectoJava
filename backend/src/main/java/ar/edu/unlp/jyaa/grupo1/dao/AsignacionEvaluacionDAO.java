package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.dao.filtro.AsignacionEvaluadorFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface AsignacionEvaluacionDAO extends GenericDAO<AsignacionEvaluacion> {

  List<AsignacionEvaluacion> listarPorEvaluador(Long evaluadorId);

  List<AsignacionEvaluacion> listarPorEvaluadorPaginado(
      Long evaluadorId,
      boolean soloPendientes,
      AsignacionEvaluadorFiltro filtro,
      int offset,
      int limit);

  long contarPorEvaluador(
      Long evaluadorId, boolean soloPendientes, AsignacionEvaluadorFiltro filtro);

  long contarEvaluadasPorEvaluador(Long evaluadorId);

  long contarAprobadasPorEvaluador(Long evaluadorId);

  List<AsignacionEvaluacion> listarPorTrabajo(Long trabajoId);

  /** Agrupa asignaciones por id de trabajo (una sola query; evita N+1 en listados). */
  Map<Long, List<AsignacionEvaluacion>> listarAgrupadasPorTrabajos(Collection<Long> trabajoIds);

  Optional<AsignacionEvaluacion> buscarActiva(Long trabajoId, Long evaluadorId);

  Optional<AsignacionEvaluacion> recuperarPorIdConDetalle(Long id);

  /**
   * Asignaciones que aún consumen cupo: sin dictamen y no rechazadas por el evaluador.
   */
  long contarPendientesDictamenPorEvaluadorYEje(Long evaluadorId, String ejeTematico);
}
