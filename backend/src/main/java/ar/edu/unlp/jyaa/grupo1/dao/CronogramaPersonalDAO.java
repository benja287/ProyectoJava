package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.CronogramaPersonal;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;

public interface CronogramaPersonalDAO extends GenericDAO<CronogramaPersonal> {

  Optional<CronogramaPersonal> buscarPorUsuarioId(Long usuarioId);

  /** Cuántas agendas personales incluyen esta actividad (asistentes agendados). */
  long contarAgendasConActividad(Long actividadId);

  /** Conteos por actividad (ids sin agendas → no aparecen en el mapa). */
  Map<Long, Long> contarAgendasPorActividadIds(Collection<Long> actividadIds);
}
