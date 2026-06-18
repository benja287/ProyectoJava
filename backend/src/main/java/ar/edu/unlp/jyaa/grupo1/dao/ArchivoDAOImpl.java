package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.modelo.Archivo;
import jakarta.enterprise.context.RequestScoped;

@RequestScoped
public class ArchivoDAOImpl extends AbstractJpaDAO<Archivo> implements ArchivoDAO {

  public ArchivoDAOImpl() {
    super(Archivo.class);
  }
}
