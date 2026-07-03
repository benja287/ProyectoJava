package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;
import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.InscripcionFiltro;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.JpqlLikeFilters;
import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RequestScoped
public class InscripcionCongresoDAOImpl extends AbstractJpaDAO<InscripcionCongreso>
    implements InscripcionCongresoDAO {

  public InscripcionCongresoDAOImpl() {
    super(InscripcionCongreso.class);
  }

  @Override
  public List<InscripcionCongreso> listarTodos() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT i FROM InscripcionCongreso i JOIN FETCH i.usuario LEFT JOIN FETCH i.pago",
              InscripcionCongreso.class)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<InscripcionCongreso> listarPorUsuario(Long usuarioId) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT i FROM InscripcionCongreso i LEFT JOIN FETCH i.pago WHERE i.usuario.id = :id",
              InscripcionCongreso.class)
          .setParameter("id", usuarioId)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public Optional<InscripcionCongreso> buscarUltimaPorUsuario(Long usuarioId) {
    EntityManager em = emConsulta();
    try {
      List<InscripcionCongreso> list =
          em.createQuery(
                  "SELECT i FROM InscripcionCongreso i LEFT JOIN FETCH i.pago LEFT JOIN FETCH i.usuario"
                      + " WHERE i.usuario.id = :id ORDER BY i.id DESC",
                  InscripcionCongreso.class)
              .setParameter("id", usuarioId)
              .setMaxResults(1)
              .getResultList();
      return list.stream().findFirst();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<InscripcionCongreso> listarFiltrado(InscripcionFiltro filtro, int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql =
          buildInscripcionWhere(
              "SELECT i FROM InscripcionCongreso i JOIN FETCH i.usuario LEFT JOIN FETCH i.pago",
              filtro,
              params);
      jpql += " ORDER BY i.fechaSolicitud DESC, i.id DESC";
      TypedQuery<InscripcionCongreso> q = em.createQuery(jpql, InscripcionCongreso.class);
      params.forEach(q::setParameter);
      return q.setFirstResult(offset).setMaxResults(limit).getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarFiltrado(InscripcionFiltro filtro) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql = buildInscripcionWhere("SELECT COUNT(i) FROM InscripcionCongreso i", filtro, params);
      TypedQuery<Long> q = em.createQuery(jpql, Long.class);
      params.forEach(q::setParameter);
      return q.getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  private static String buildInscripcionWhere(
      String select, InscripcionFiltro filtro, Map<String, Object> params) {
    StringBuilder jpql = new StringBuilder(select).append(" WHERE 1=1");
    if (filtro.usuarioId() != null) {
      jpql.append(" AND i.usuario.id = :usuarioId");
      params.put("usuarioId", filtro.usuarioId());
    }
    if (filtro.estado() != null) {
      jpql.append(" AND i.estado = :estado");
      params.put("estado", filtro.estado());
    }
    JpqlLikeFilters.appendLike(jpql, params, "i.categoria", "categoria", filtro.categoria());
    return jpql.toString();
  }

  @Override
  public List<InscripcionCongreso> listarPorPago(Long pagoId) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT i FROM InscripcionCongreso i JOIN FETCH i.usuario LEFT JOIN FETCH i.pago"
                  + " WHERE i.pago.id = :pagoId",
              InscripcionCongreso.class)
          .setParameter("pagoId", pagoId)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public Optional<InscripcionCongreso> buscarPorPagoId(Long pagoId) {
    EntityManager em = emConsulta();
    try {
      List<InscripcionCongreso> list =
          em.createQuery(
                  "SELECT i FROM InscripcionCongreso i JOIN FETCH i.usuario LEFT JOIN FETCH i.pago"
                      + " WHERE i.pago.id = :pagoId",
                  InscripcionCongreso.class)
              .setParameter("pagoId", pagoId)
              .setMaxResults(1)
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
