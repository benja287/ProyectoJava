package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;
import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import jakarta.persistence.EntityManager;
import java.util.List;

@RequestScoped
public class TrabajoDAOImpl extends AbstractJpaDAO<Trabajo> implements TrabajoDAO {

  public TrabajoDAOImpl() {
    super(Trabajo.class);
  }

  @Override
  public List<Trabajo> listarTodos() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT t FROM Trabajo t JOIN FETCH t.autor ORDER BY t.fechaCreacion DESC", Trabajo.class)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<Trabajo> listarPorAutor(Long autorId) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT t FROM Trabajo t JOIN FETCH t.autor WHERE t.autor.id = :id ORDER BY t.fechaCreacion DESC",
              Trabajo.class)
          .setParameter("id", autorId)
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
