package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Circular;
import jakarta.persistence.EntityManager;
import java.util.List;

public class CircularDAOImpl extends AbstractJpaDAO<Circular> implements CircularDAO {

  public CircularDAOImpl() {
    super(Circular.class);
  }

  @Override
  public List<Circular> listarPublicadas() {
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.createQuery(
              "SELECT c FROM Circular c WHERE c.publicada = true ORDER BY c.fechaPublicacion DESC",
              Circular.class)
          .getResultList();
    } finally {
      em.close();
    }
  }
}
