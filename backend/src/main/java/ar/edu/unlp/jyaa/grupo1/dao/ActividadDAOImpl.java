package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;
import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.ActividadFiltro;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.JpqlLikeFilters;
import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoActividad;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequestScoped
public class ActividadDAOImpl extends AbstractJpaDAO<Actividad> implements ActividadDAO {

  public ActividadDAOImpl() {
    super(Actividad.class);
  }

  @Override
  public List<Actividad> listarTodos() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery("SELECT a FROM Actividad a ORDER BY a.inicio", Actividad.class)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<Actividad> listarPaginado(int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery("SELECT a FROM Actividad a ORDER BY a.inicio", Actividad.class)
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
      return em.createQuery("SELECT COUNT(a) FROM Actividad a", Long.class).getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarFiltrado(ActividadFiltro filtro) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql = buildActividadWhere("SELECT COUNT(a) FROM Actividad a", filtro, params);
      TypedQuery<Long> q = em.createQuery(jpql, Long.class);
      params.forEach(q::setParameter);
      return q.getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<Actividad> listarFiltrado(ActividadFiltro filtro, int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql = buildActividadWhere("SELECT a FROM Actividad a", filtro, params);
      jpql += " ORDER BY a.inicio";
      TypedQuery<Actividad> q = em.createQuery(jpql, Actividad.class);
      params.forEach(q::setParameter);
      return q.setFirstResult(offset).setMaxResults(limit).getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  private static String buildActividadWhere(
      String select, ActividadFiltro filtro, Map<String, Object> params) {
    StringBuilder jpql = new StringBuilder(select).append(" WHERE 1=1");
    JpqlLikeFilters.appendLike(jpql, params, "a.codigo", "codigo", filtro.codigo());
    JpqlLikeFilters.appendLike(jpql, params, "a.titulo", "titulo", filtro.titulo());
    JpqlLikeFilters.appendLike(jpql, params, "a.sala", "sala", filtro.sala());
    if (filtro.tipoActividad() != null) {
      jpql.append(" AND a.tipoActividad = :tipoActividad");
      params.put("tipoActividad", filtro.tipoActividad());
    }
    return jpql.toString();
  }

  @Override
  public List<Actividad> buscarConflictos(
      String sala, LocalDateTime inicio, LocalDateTime fin, Long excluirId) {
    EntityManager em = emConsulta();
    try {
      var q =
          em.createQuery(
              "SELECT a FROM Actividad a WHERE a.sala = :sala AND a.inicio < :fin AND a.fin > :inicio"
                  + (excluirId != null ? " AND a.id <> :excluir" : ""),
              Actividad.class);
      q.setParameter("sala", sala);
      q.setParameter("inicio", inicio);
      q.setParameter("fin", fin);
      if (excluirId != null) {
        q.setParameter("excluir", excluirId);
      }
      return q.getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<Actividad> buscarSolapamientoTipo(
      TipoActividad tipo, LocalDateTime inicio, LocalDateTime fin, Long excluirId) {
    EntityManager em = emConsulta();
    try {
      var q =
          em.createQuery(
              "SELECT a FROM Actividad a WHERE a.tipoActividad = :tipo"
                  + " AND a.inicio < :fin AND a.fin > :inicio"
                  + (excluirId != null ? " AND a.id <> :excluir" : ""),
              Actividad.class);
      q.setParameter("tipo", tipo);
      q.setParameter("inicio", inicio);
      q.setParameter("fin", fin);
      if (excluirId != null) {
        q.setParameter("excluir", excluirId);
      }
      return q.getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<Actividad> listarCronogramaCompleto() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT DISTINCT a FROM Actividad a"
                  + " LEFT JOIN FETCH a.trabajos t LEFT JOIN FETCH t.autor"
                  + " ORDER BY a.inicio ASC, a.tipoActividad ASC",
              Actividad.class)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public void desvincularTrabajo(Long trabajoId) {
    if (trabajoId == null) {
      return;
    }
    EntityManager em = emConsulta();
    boolean legacy = getEntityManager() == null;
    try {
      if (legacy) {
        em.getTransaction().begin();
      }
      em.createNativeQuery("DELETE FROM actividad_trabajos WHERE trabajo_id = :id")
          .setParameter("id", trabajoId)
          .executeUpdate();
      em.createNativeQuery(
              "UPDATE actividades SET propuesta_taller_id = NULL WHERE propuesta_taller_id = :id")
          .setParameter("id", trabajoId)
          .executeUpdate();
      if (legacy) {
        em.getTransaction().commit();
      }
    } catch (RuntimeException e) {
      if (legacy && em.getTransaction().isActive()) {
        em.getTransaction().rollback();
      }
      throw e;
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
