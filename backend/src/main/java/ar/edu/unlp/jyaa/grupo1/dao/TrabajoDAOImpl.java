package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import jakarta.persistence.EntityManager;
import java.util.List;

public class TrabajoDAOImpl extends AbstractJpaDAO<Trabajo> implements TrabajoDAO {

  public TrabajoDAOImpl() {
    super(Trabajo.class);
  }

  @Override
  public List<Trabajo> listarTodos() {
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.createQuery(
              "SELECT t FROM Trabajo t JOIN FETCH t.autor ORDER BY t.fechaCreacion DESC", Trabajo.class)
          .getResultList();
    } finally {
      em.close();
    }
  }

  @Override
  public List<Trabajo> listarPorAutor(Long autorId) {
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.createQuery(
              "SELECT t FROM Trabajo t JOIN FETCH t.autor WHERE t.autor.id = :id ORDER BY t.fechaCreacion DESC",
              Trabajo.class)
          .setParameter("id", autorId)
          .getResultList();
    } finally {
      em.close();
    }
  }
}
