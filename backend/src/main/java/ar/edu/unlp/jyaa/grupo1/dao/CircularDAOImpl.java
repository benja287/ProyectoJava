package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;
import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Circular;
import jakarta.persistence.EntityManager;
import java.util.List;

@RequestScoped
public class CircularDAOImpl extends AbstractJpaDAO<Circular> implements CircularDAO {

  public CircularDAOImpl() {
    super(Circular.class);
  }

  @Override
  public List<Circular> listarPublicadas() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT c FROM Circular c WHERE c.publicada = true ORDER BY c.fechaPublicacion DESC",
              Circular.class)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  private EntityManager emConsulta() {
    EntityManager cdi = getEntityManager();
    return cdi != null ? cdi : JpaUtil.createEntityManager();
  }

  private void closeLegacy(EntityManager em) {
    if (getEntityManager() == null) {
      em.close();
    }
  }
}
