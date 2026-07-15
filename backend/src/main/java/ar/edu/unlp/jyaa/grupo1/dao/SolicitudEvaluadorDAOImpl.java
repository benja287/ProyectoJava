package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoSolicitudEvaluador;
import ar.edu.unlp.jyaa.grupo1.modelo.SolicitudEvaluador;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;

@RequestScoped
public class SolicitudEvaluadorDAOImpl extends AbstractJpaDAO<SolicitudEvaluador>
    implements SolicitudEvaluadorDAO {

  public SolicitudEvaluadorDAOImpl() {
    super(SolicitudEvaluador.class);
  }

  @Override
  public Optional<SolicitudEvaluador> buscarUltimaPorUsuario(Long usuarioId) {
    EntityManager em = emConsulta();
    try {
      List<SolicitudEvaluador> list =
          em.createQuery(
                  "SELECT s FROM SolicitudEvaluador s WHERE s.usuario.id = :uid ORDER BY s.fechaSolicitud DESC",
                  SolicitudEvaluador.class)
              .setParameter("uid", usuarioId)
              .setMaxResults(1)
              .getResultList();
      return list.stream().findFirst();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public Optional<SolicitudEvaluador> buscarPendientePorUsuario(Long usuarioId) {
    EntityManager em = emConsulta();
    try {
      List<SolicitudEvaluador> list =
          em.createQuery(
                  "SELECT s FROM SolicitudEvaluador s WHERE s.usuario.id = :uid AND s.estado = :est ORDER BY s.fechaSolicitud DESC",
                  SolicitudEvaluador.class)
              .setParameter("uid", usuarioId)
              .setParameter("est", EstadoSolicitudEvaluador.PENDIENTE)
              .setMaxResults(1)
              .getResultList();
      return list.stream().findFirst();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<SolicitudEvaluador> listarPorEstado(
      EstadoSolicitudEvaluador estado, int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT DISTINCT s FROM SolicitudEvaluador s JOIN FETCH s.usuario LEFT JOIN FETCH s.revisadoPor WHERE s.estado = :est ORDER BY s.fechaSolicitud DESC",
              SolicitudEvaluador.class)
          .setParameter("est", estado)
          .setFirstResult(offset)
          .setMaxResults(limit)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarPorEstado(EstadoSolicitudEvaluador estado) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT COUNT(s) FROM SolicitudEvaluador s WHERE s.estado = :est", Long.class)
          .setParameter("est", estado)
          .getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<SolicitudEvaluador> listarTodas(int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT DISTINCT s FROM SolicitudEvaluador s JOIN FETCH s.usuario LEFT JOIN FETCH s.revisadoPor ORDER BY s.fechaSolicitud DESC",
              SolicitudEvaluador.class)
          .setFirstResult(offset)
          .setMaxResults(limit)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarTodas() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery("SELECT COUNT(s) FROM SolicitudEvaluador s", Long.class).getSingleResult();
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
