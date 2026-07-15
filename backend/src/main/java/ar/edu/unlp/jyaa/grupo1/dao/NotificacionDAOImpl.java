package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Notificacion;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.List;

@RequestScoped
public class NotificacionDAOImpl extends AbstractJpaDAO<Notificacion> implements NotificacionDAO {

  public NotificacionDAOImpl() {
    super(Notificacion.class);
  }

  @Override
  public List<Notificacion> listarTodos() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT n FROM Notificacion n JOIN FETCH n.usuario ORDER BY n.fechaCreacion DESC",
              Notificacion.class)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<Notificacion> listarPorUsuario(Long usuarioId, int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT n FROM Notificacion n WHERE n.usuario.id = :uid ORDER BY n.fechaCreacion DESC",
              Notificacion.class)
          .setParameter("uid", usuarioId)
          .setFirstResult(offset)
          .setMaxResults(limit)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarPorUsuario(Long usuarioId) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT COUNT(n) FROM Notificacion n WHERE n.usuario.id = :uid", Long.class)
          .setParameter("uid", usuarioId)
          .getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarNoLeidas(Long usuarioId) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT COUNT(n) FROM Notificacion n WHERE n.usuario.id = :uid AND n.leida = false",
              Long.class)
          .setParameter("uid", usuarioId)
          .getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarTodas() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery("SELECT COUNT(n) FROM Notificacion n", Long.class).getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarLeidas() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT COUNT(n) FROM Notificacion n WHERE n.leida = true", Long.class)
          .getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public int eliminarLeidas() {
    return ejecutarDelete("DELETE FROM Notificacion n WHERE n.leida = true");
  }

  @Override
  public int eliminarAntesDe(LocalDateTime fecha) {
    EntityManager em = emConsulta();
    try {
      if (usesCdiEm()) {
        return em.createQuery("DELETE FROM Notificacion n WHERE n.fechaCreacion < :fecha")
            .setParameter("fecha", fecha)
            .executeUpdate();
      }
      var tx = em.getTransaction();
      try {
        tx.begin();
        int n =
            em.createQuery("DELETE FROM Notificacion n WHERE n.fechaCreacion < :fecha")
                .setParameter("fecha", fecha)
                .executeUpdate();
        tx.commit();
        return n;
      } catch (RuntimeException e) {
        if (tx.isActive()) {
          tx.rollback();
        }
        throw e;
      }
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public int eliminarTodas() {
    return ejecutarDelete("DELETE FROM Notificacion n");
  }

  private int ejecutarDelete(String jpql) {
    EntityManager em = emConsulta();
    try {
      if (usesCdiEm()) {
        return em.createQuery(jpql).executeUpdate();
      }
      var tx = em.getTransaction();
      try {
        tx.begin();
        int n = em.createQuery(jpql).executeUpdate();
        tx.commit();
        return n;
      } catch (RuntimeException e) {
        if (tx.isActive()) {
          tx.rollback();
        }
        throw e;
      }
    } finally {
      closeLegacy(em);
    }
  }

  private boolean usesCdiEm() {
    return getEntityManager() != null;
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
