package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.PlantillaEmail;
import jakarta.persistence.EntityManager;
import java.util.Optional;

@RequestScoped
public class PlantillaEmailDAOImpl extends AbstractJpaDAO<PlantillaEmail> implements PlantillaEmailDAO {

  public PlantillaEmailDAOImpl() {
    super(PlantillaEmail.class);
  }

  @Override
  public Optional<PlantillaEmail> buscarPorNombre(String nombre) {
    EntityManager em = getEntityManager();
    if (em != null) {
      return buscarPorNombreEn(em, nombre);
    }
    EntityManager legacy = JpaUtil.createEntityManager();
    try {
      return buscarPorNombreEn(legacy, nombre);
    } finally {
      legacy.close();
    }
  }

  private Optional<PlantillaEmail> buscarPorNombreEn(EntityManager em, String nombre) {
    var list =
        em.createQuery(
                "SELECT p FROM PlantillaEmail p WHERE p.nombre = :nombre", PlantillaEmail.class)
            .setParameter("nombre", nombre)
            .setMaxResults(1)
            .getResultList();
    return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
  }
}
