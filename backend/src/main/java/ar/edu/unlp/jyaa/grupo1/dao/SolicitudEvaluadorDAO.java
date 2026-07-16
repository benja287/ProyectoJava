package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.EstadoSolicitudEvaluador;
import ar.edu.unlp.jyaa.grupo1.modelo.SolicitudEvaluador;
import java.util.List;
import java.util.Optional;

public interface SolicitudEvaluadorDAO extends GenericDAO<SolicitudEvaluador> {

  Optional<SolicitudEvaluador> buscarUltimaPorUsuario(Long usuarioId);

  Optional<SolicitudEvaluador> buscarPendientePorUsuario(Long usuarioId);

  List<SolicitudEvaluador> listarPorUsuarioYEstado(Long usuarioId, EstadoSolicitudEvaluador estado);

  List<SolicitudEvaluador> listarPorEstado(EstadoSolicitudEvaluador estado, int offset, int limit);

  long contarPorEstado(EstadoSolicitudEvaluador estado);

  List<SolicitudEvaluador> listarTodas(int offset, int limit);

  long contarTodas();
}
