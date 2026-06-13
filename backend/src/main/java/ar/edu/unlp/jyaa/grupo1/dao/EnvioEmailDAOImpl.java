package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;

import ar.edu.unlp.jyaa.grupo1.modelo.EnvioEmail;

@RequestScoped
public class EnvioEmailDAOImpl extends AbstractJpaDAO<EnvioEmail> implements EnvioEmailDAO {

  public EnvioEmailDAOImpl() {
    super(EnvioEmail.class);
  }
}
