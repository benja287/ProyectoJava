package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.JpqlLikeFilters;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.PagoFiltro;
import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.Pago;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequestScoped
public class PagoDAOImpl extends AbstractJpaDAO<Pago> implements PagoDAO {

  public PagoDAOImpl() {
    super(Pago.class);
  }

  @Override
  public List<Pago> listarPorEstado(EstadoPago estado) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery("SELECT p FROM Pago p WHERE p.estado = :e ORDER BY p.id DESC", Pago.class)
          .setParameter("e", estado)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<Pago> listarPorEstadoPaginado(EstadoPago estado, int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery("SELECT p FROM Pago p WHERE p.estado = :e ORDER BY p.id DESC", Pago.class)
          .setParameter("e", estado)
          .setFirstResult(offset)
          .setMaxResults(limit)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarPorEstado(EstadoPago estado) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery("SELECT COUNT(p) FROM Pago p WHERE p.estado = :e", Long.class)
          .setParameter("e", estado)
          .getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<Pago> listarPaginado(int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery("SELECT p FROM Pago p ORDER BY p.id DESC", Pago.class)
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
      return em.createQuery("SELECT COUNT(p) FROM Pago p", Long.class).getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<Pago> listarFiltrado(PagoFiltro filtro, int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql = buildPagoWhere("SELECT p FROM Pago p", filtro, params);
      jpql += " ORDER BY p.id DESC";
      TypedQuery<Pago> q = em.createQuery(jpql, Pago.class);
      params.forEach(q::setParameter);
      return q.setFirstResult(offset).setMaxResults(limit).getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarFiltrado(PagoFiltro filtro) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql = buildPagoWhere("SELECT COUNT(p) FROM Pago p", filtro, params);
      TypedQuery<Long> q = em.createQuery(jpql, Long.class);
      params.forEach(q::setParameter);
      return q.getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  private static String buildPagoWhere(
      String select, PagoFiltro filtro, Map<String, Object> params) {
    StringBuilder jpql = new StringBuilder(select).append(" WHERE 1=1");
    if (filtro.estado() != null) {
      jpql.append(" AND p.estado = :estado");
      params.put("estado", filtro.estado());
    }
    if (filtro.monto() != null) {
      jpql.append(" AND p.monto = :monto");
      params.put("monto", filtro.monto());
    }
    JpqlLikeFilters.appendLike(
        jpql, params, "p.motivoRechazo", "motivoRechazo", filtro.motivoRechazo());
    if (filtro.usuarioId() != null) {
      jpql.append(
          " AND EXISTS (SELECT 1 FROM InscripcionCongreso i WHERE i.pago = p AND"
              + " i.usuario.id = :usuarioId)");
      params.put("usuarioId", filtro.usuarioId());
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
