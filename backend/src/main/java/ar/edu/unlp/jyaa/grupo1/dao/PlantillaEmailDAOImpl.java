package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;

import ar.edu.unlp.jyaa.grupo1.modelo.PlantillaEmail;

@RequestScoped
public class PlantillaEmailDAOImpl extends AbstractJpaDAO<PlantillaEmail> implements PlantillaEmailDAO {

  public PlantillaEmailDAOImpl() {
    super(PlantillaEmail.class);
  }
}
