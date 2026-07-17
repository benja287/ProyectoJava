package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.dao.filtro.PagoFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.Pago;
import java.time.LocalDateTime;
import java.util.List;

public interface PagoDAO extends GenericDAO<Pago> {

  List<Pago> listarPorEstado(EstadoPago estado);

  List<Pago> listarPorEstadoPaginado(EstadoPago estado, int offset, int limit);

  long contarPorEstado(EstadoPago estado);

  List<Pago> listarPaginado(int offset, int limit);

  long contar();

  List<Pago> listarFiltrado(PagoFiltro filtro, int offset, int limit);

  long contarFiltrado(PagoFiltro filtro);

  /** Efectivo aprobado con recepción física confirmada, por rango de fechaValidacion. */
  List<Pago> listarArqueoEfectivo(LocalDateTime desdeInclusive, LocalDateTime hastaExclusive);
}
