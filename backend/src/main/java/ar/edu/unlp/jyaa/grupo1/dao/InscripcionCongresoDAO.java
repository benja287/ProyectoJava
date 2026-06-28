package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import java.util.List;
import java.util.Optional;

public interface InscripcionCongresoDAO extends GenericDAO<InscripcionCongreso> {

  List<InscripcionCongreso> listarPorUsuario(Long usuarioId);

  Optional<InscripcionCongreso> buscarUltimaPorUsuario(Long usuarioId);

  List<InscripcionCongreso> listarPorPago(Long pagoId);
}
