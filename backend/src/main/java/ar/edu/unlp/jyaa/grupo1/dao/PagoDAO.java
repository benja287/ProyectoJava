package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.EstadoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.Pago;
import java.util.List;

public interface PagoDAO extends GenericDAO<Pago> {

  List<Pago> listarPorEstado(EstadoPago estado);

  List<Pago> listarPorEstadoPaginado(EstadoPago estado, int offset, int limit);

  long contarPorEstado(EstadoPago estado);
}
