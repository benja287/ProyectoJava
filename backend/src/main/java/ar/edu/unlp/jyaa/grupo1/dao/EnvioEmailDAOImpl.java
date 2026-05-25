package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.EnvioEmail;

public class EnvioEmailDAOImpl extends AbstractJpaDAO<EnvioEmail> implements EnvioEmailDAO {

  public EnvioEmailDAOImpl() {
    super(EnvioEmail.class);
  }
}
