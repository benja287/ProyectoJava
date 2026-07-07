package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.EnvioEmailFiltro;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.JpqlLikeFilters;
import ar.edu.unlp.jyaa.grupo1.modelo.EnvioEmail;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequestScoped
public class EnvioEmailDAOImpl extends AbstractJpaDAO<EnvioEmail> implements EnvioEmailDAO {

  public EnvioEmailDAOImpl() {
    super(EnvioEmail.class);
  }

  @Override
  public List<EnvioEmail> listarFiltrado(EnvioEmailFiltro filtro, int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql = buildWhere("SELECT e FROM EnvioEmail e", filtro, params);
      jpql += " ORDER BY e.fechaEnvio DESC, e.id DESC";
      TypedQuery<EnvioEmail> q = em.createQuery(jpql, EnvioEmail.class);
      params.forEach(q::setParameter);
      return q.setFirstResult(offset).setMaxResults(limit).getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarFiltrado(EnvioEmailFiltro filtro) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql = buildWhere("SELECT COUNT(e) FROM EnvioEmail e", filtro, params);
      TypedQuery<Long> q = em.createQuery(jpql, Long.class);
      params.forEach(q::setParameter);
      return q.getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarEnviados() {
    return contarFiltrado(new EnvioEmailFiltro(true, null));
  }

  @Override
  public long contarFallidos() {
    return contarFiltrado(new EnvioEmailFiltro(false, null));
  }

  @Override
  public int eliminarFallidos() {
    return ejecutarDelete("DELETE FROM EnvioEmail e WHERE e.enviado = false");
  }

  @Override
  public int eliminarAntesDe(LocalDateTime fecha) {
    EntityManager em = emConsulta();
    try {
      if (usesCdiEm()) {
        return em.createQuery("DELETE FROM EnvioEmail e WHERE e.fechaEnvio < :fecha")
            .setParameter("fecha", fecha)
            .executeUpdate();
      }
      var tx = em.getTransaction();
      try {
        tx.begin();
        int n =
            em.createQuery("DELETE FROM EnvioEmail e WHERE e.fechaEnvio < :fecha")
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
  public int eliminarTodos() {
    return ejecutarDelete("DELETE FROM EnvioEmail e");
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

  private static String buildWhere(
      String select, EnvioEmailFiltro filtro, Map<String, Object> params) {
    StringBuilder jpql = new StringBuilder(select).append(" WHERE 1=1");
    if (filtro != null) {
      if (filtro.enviado() != null) {
        jpql.append(" AND e.enviado = :enviado");
        params.put("enviado", filtro.enviado());
      }
      JpqlLikeFilters.appendLike(
          jpql, params, "e.destinatario", "destinatario", filtro.destinatario());
    }
    return jpql.toString();
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
