package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.EvaluadorEjeCapacidad;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EvaluadorEjeCapacidadDAO extends GenericDAO<EvaluadorEjeCapacidad> {

  Optional<EvaluadorEjeCapacidad> buscarPorUsuarioYEje(Long usuarioId, String ejeTematico);

  List<EvaluadorEjeCapacidad> listarPorUsuario(Long usuarioId);

  List<EvaluadorEjeCapacidad> listarActivosPorUsuario(Long usuarioId);

  List<EvaluadorEjeCapacidad> listarPorUsuarios(Collection<Long> usuarioIds);
}
