package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.PlantillaEmail;

public class PlantillaEmailDAOImpl extends AbstractJpaDAO<PlantillaEmail> implements PlantillaEmailDAO {

  public PlantillaEmailDAOImpl() {
    super(PlantillaEmail.class);
  }
}
