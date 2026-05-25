package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.Pago;

public class PagoDAOImpl extends AbstractJpaDAO<Pago> implements PagoDAO {

  public PagoDAOImpl() {
    super(Pago.class);
  }
}
