package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Aula;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import java.util.List;

@RequestScoped
public class AulaDAOImpl extends AbstractJpaDAO<Aula> implements AulaDAO {

  public AulaDAOImpl() {
    super(Aula.class);
  }

  @Override
  public List<Aula> listarTodas() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery("SELECT a FROM Aula a ORDER BY a.nombre", Aula.class).getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<Aula> listarActivas() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT a FROM Aula a WHERE a.activa = true ORDER BY a.nombre", Aula.class)
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
