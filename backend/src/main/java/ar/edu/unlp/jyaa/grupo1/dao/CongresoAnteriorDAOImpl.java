package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.CongresoAnterior;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import java.util.List;

@RequestScoped
public class CongresoAnteriorDAOImpl extends AbstractJpaDAO<CongresoAnterior>
    implements CongresoAnteriorDAO {

  public CongresoAnteriorDAOImpl() {
    super(CongresoAnterior.class);
  }

  @Override
  public List<CongresoAnterior> listarOrdenados() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT c FROM CongresoAnterior c ORDER BY c.orden ASC, c.anio ASC",
              CongresoAnterior.class)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contar() {
    EntityManager em = emConsulta();
    try {
      Long n =
          em.createQuery("SELECT COUNT(c) FROM CongresoAnterior c", Long.class).getSingleResult();
      return n != null ? n : 0L;
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
