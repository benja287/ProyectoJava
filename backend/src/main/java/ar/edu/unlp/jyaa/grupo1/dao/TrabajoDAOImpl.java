package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;
import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;

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

  @Override
  public List<Trabajo> listarPaginado(int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT t FROM Trabajo t JOIN FETCH t.autor ORDER BY t.fechaCreacion DESC", Trabajo.class)
          .setFirstResult(offset)
          .setMaxResults(limit)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contar() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery("SELECT COUNT(t) FROM Trabajo t", Long.class).getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<Trabajo> listarPorAutorPaginado(Long autorId, int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT t FROM Trabajo t JOIN FETCH t.autor WHERE t.autor.id = :id ORDER BY t.fechaCreacion DESC",
              Trabajo.class)
          .setParameter("id", autorId)
          .setFirstResult(offset)
          .setMaxResults(limit)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarPorAutor(Long autorId) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT COUNT(t) FROM Trabajo t WHERE t.autor.id = :id", Long.class)
          .setParameter("id", autorId)
          .getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public Optional<Trabajo> recuperarPorIdConAutor(Long id) {
    EntityManager em = emConsulta();
    try {
      List<Trabajo> list =
          em.createQuery(
                  "SELECT t FROM Trabajo t JOIN FETCH t.autor WHERE t.id = :id", Trabajo.class)
              .setParameter("id", id)
              .getResultList();
      return list.stream().findFirst();
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
