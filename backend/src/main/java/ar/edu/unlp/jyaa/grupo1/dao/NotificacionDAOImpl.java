package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.JpqlLikeFilters;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.NotificacionFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.Notificacion;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

  public Notificacion recuperarPorIdConUsuario(Long id) {
    EntityManager em = emConsulta();
    try {
      List<Notificacion> list =
          em.createQuery(
                  "SELECT n FROM Notificacion n JOIN FETCH n.usuario WHERE n.id = :id",
                  Notificacion.class)
              .setParameter("id", id)
              .getResultList();
      return list.isEmpty() ? null : list.get(0);
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
  public List<Notificacion> listarFiltrado(NotificacionFiltro filtro, int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql =
          buildWhere(
                  "SELECT n FROM Notificacion n JOIN FETCH n.usuario", filtro, params)
              + " ORDER BY n.fechaCreacion DESC";
      TypedQuery<Notificacion> q = em.createQuery(jpql, Notificacion.class);
      params.forEach(q::setParameter);
      return q.setFirstResult(offset).setMaxResults(limit).getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarFiltrado(NotificacionFiltro filtro) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql = buildWhere("SELECT COUNT(n) FROM Notificacion n JOIN n.usuario", filtro, params);
      TypedQuery<Long> q = em.createQuery(jpql, Long.class);
      params.forEach(q::setParameter);
      return q.getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  private static String buildWhere(
      String select, NotificacionFiltro filtro, Map<String, Object> params) {
    StringBuilder jpql = new StringBuilder(select).append(" WHERE 1=1");
    if (filtro != null) {
      if (filtro.leida() != null) {
        jpql.append(" AND n.leida = :leida");
        params.put("leida", filtro.leida());
      }
      JpqlLikeFilters.appendLike(jpql, params, "n.usuario.email", "destinatario", filtro.destinatario());
    }
    return jpql.toString();
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
