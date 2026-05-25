package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.Anuncio;

public class AnuncioDAOImpl extends AbstractJpaDAO<Anuncio> implements AnuncioDAO {

  public AnuncioDAOImpl() {
    super(Anuncio.class);
  }
}
