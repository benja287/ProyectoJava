package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.JpqlLikeFilters;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.TrabajoFiltro;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

  @Override
  public List<Trabajo> listarFiltrado(TrabajoFiltro filtro, int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql =
          buildTrabajoWhere("SELECT t FROM Trabajo t JOIN FETCH t.autor", filtro, params, false);
      jpql += " ORDER BY t.fechaCreacion DESC";
      TypedQuery<Trabajo> q = em.createQuery(jpql, Trabajo.class);
      params.forEach(q::setParameter);
      return q.setFirstResult(offset).setMaxResults(limit).getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarFiltrado(TrabajoFiltro filtro) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql = buildTrabajoWhere("SELECT COUNT(t) FROM Trabajo t", filtro, params, false);
      TypedQuery<Long> q = em.createQuery(jpql, Long.class);
      params.forEach(q::setParameter);
      return q.getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<Trabajo> listarFiltradoComite(TrabajoFiltro filtro, int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql =
          buildTrabajoWhere("SELECT t FROM Trabajo t JOIN FETCH t.autor", filtro, params, true);
      jpql += " ORDER BY t.fechaCreacion DESC";
      TypedQuery<Trabajo> q = em.createQuery(jpql, Trabajo.class);
      params.forEach(q::setParameter);
      List<Trabajo> list = q.setFirstResult(offset).setMaxResults(limit).getResultList();
      // Evita LazyInitializationException al armar DTOs si el EM se cierra después.
      for (Trabajo t : list) {
        if (t.getCoautores() != null) {
          t.getCoautores().size();
        }
      }
      return list;
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarFiltradoComite(TrabajoFiltro filtro) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql = buildTrabajoWhere("SELECT COUNT(t) FROM Trabajo t", filtro, params, true);
      TypedQuery<Long> q = em.createQuery(jpql, Long.class);
      params.forEach(q::setParameter);
      return q.getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  private static String buildTrabajoWhere(
      String select, TrabajoFiltro filtro, Map<String, Object> params, boolean alcanceComite) {
    StringBuilder jpql = new StringBuilder(select).append(" WHERE 1=1");
    if (filtro.autorId() != null) {
      jpql.append(" AND t.autor.id = :autorId");
      params.put("autorId", filtro.autorId());
    }
    if (filtro.excluirAutorId() != null) {
      jpql.append(" AND (t.autor IS NULL OR t.autor.id <> :excluirAutorId)");
      params.put("excluirAutorId", filtro.excluirAutorId());
    }
    JpqlLikeFilters.appendLike(jpql, params, "t.titulo", "titulo", filtro.titulo());
    JpqlLikeFilters.appendLike(jpql, params, "t.resumen", "resumen", filtro.resumen());
    JpqlLikeFilters.appendLike(jpql, params, "t.ejeTematico", "ejeTematico", filtro.ejeTematico());
    if (filtro.estado() != null) {
      jpql.append(" AND t.estado = :estado");
      params.put("estado", filtro.estado());
    }
    if (filtro.modalidad() != null) {
      jpql.append(" AND t.modalidad = :modalidad");
      params.put("modalidad", filtro.modalidad());
    }
    if (filtro.tipo() != null) {
      jpql.append(" AND t.tipo = :tipo");
      params.put("tipo", filtro.tipo());
    }
    if (alcanceComite) {
      jpql.append(" AND t.tipo <> :tipoExcluidoComite");
      params.put("tipoExcluidoComite", TipoTrabajo.PROPUESTA_TALLER.name());
      if (filtro.estado() == null) {
        jpql.append(" AND t.estado NOT IN :estadosExcluidosComite");
        params.put(
            "estadosExcluidosComite",
            List.of(EstadoTrabajo.RECHAZADO, EstadoTrabajo.BORRADOR));
      }
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
