package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;

import ar.edu.unlp.jyaa.grupo1.modelo.Anuncio;

@RequestScoped
public class AnuncioDAOImpl extends AbstractJpaDAO<Anuncio> implements AnuncioDAO {

  public AnuncioDAOImpl() {
    super(Anuncio.class);
  }
}
