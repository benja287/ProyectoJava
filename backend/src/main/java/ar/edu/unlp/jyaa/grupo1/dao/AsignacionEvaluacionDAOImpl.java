package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.RecomendacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoTrabajo;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.util.List;
import java.util.Optional;

@RequestScoped
public class AsignacionEvaluacionDAOImpl extends AbstractJpaDAO<AsignacionEvaluacion>
    implements AsignacionEvaluacionDAO {

  private static final String BASE_WHERE_CIENTIFICO =
      " WHERE a.evaluador.id = :id AND a.trabajo.tipo <> :tipoTaller";

  private static final String PENDIENTE_WHERE =
      " AND a.evaluacion IS NULL"
          + " AND a.trabajo.estado NOT IN :estadosCerrados";

  public AsignacionEvaluacionDAOImpl() {
    super(AsignacionEvaluacion.class);
  }

  @Override
  public List<AsignacionEvaluacion> listarTodos() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT a FROM AsignacionEvaluacion a JOIN FETCH a.trabajo JOIN FETCH a.evaluador",
              AsignacionEvaluacion.class)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<AsignacionEvaluacion> listarPorEvaluador(Long evaluadorId) {
    return listarPorEvaluadorPaginado(evaluadorId, false, 0, 500);
  }

  @Override
  public List<AsignacionEvaluacion> listarPorEvaluadorPaginado(
      Long evaluadorId, boolean soloPendientes, int offset, int limit) {
    EntityManager em = emConsulta();
    try {
      String idsJpql =
          "SELECT a.id FROM AsignacionEvaluacion a"
              + BASE_WHERE_CIENTIFICO
              + (soloPendientes ? PENDIENTE_WHERE : "")
              + " ORDER BY a.id DESC";
      TypedQuery<Long> idsQuery = em.createQuery(idsJpql, Long.class);
      idsQuery.setParameter("id", evaluadorId);
      idsQuery.setParameter("tipoTaller", TipoTrabajo.PROPUESTA_TALLER);
      if (soloPendientes) {
        idsQuery.setParameter(
            "estadosCerrados",
            List.of(
                EstadoTrabajo.RECHAZADO,
                EstadoTrabajo.APROBADO,
                EstadoTrabajo.PENDIENTE_APROBACION_COMITE));
      }
      List<Long> ids =
          idsQuery.setFirstResult(offset).setMaxResults(limit).getResultList();
      if (ids.isEmpty()) {
        return List.of();
      }
      return em.createQuery(
              "SELECT DISTINCT a FROM AsignacionEvaluacion a"
                  + " JOIN FETCH a.trabajo LEFT JOIN FETCH a.evaluacion"
                  + " WHERE a.id IN :ids ORDER BY a.id DESC",
              AsignacionEvaluacion.class)
          .setParameter("ids", ids)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarPorEvaluador(Long evaluadorId, boolean soloPendientes) {
    EntityManager em = emConsulta();
    try {
      String jpql =
          "SELECT COUNT(a) FROM AsignacionEvaluacion a"
              + BASE_WHERE_CIENTIFICO
              + (soloPendientes ? PENDIENTE_WHERE : "");
      TypedQuery<Long> q = em.createQuery(jpql, Long.class);
      q.setParameter("id", evaluadorId);
      q.setParameter("tipoTaller", TipoTrabajo.PROPUESTA_TALLER);
      if (soloPendientes) {
        q.setParameter(
            "estadosCerrados",
            List.of(
                EstadoTrabajo.RECHAZADO,
                EstadoTrabajo.APROBADO,
                EstadoTrabajo.PENDIENTE_APROBACION_COMITE));
      }
      return q.getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarEvaluadasPorEvaluador(Long evaluadorId) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT COUNT(a) FROM AsignacionEvaluacion a"
                  + BASE_WHERE_CIENTIFICO
                  + " AND a.evaluacion IS NOT NULL",
              Long.class)
          .setParameter("id", evaluadorId)
          .setParameter("tipoTaller", TipoTrabajo.PROPUESTA_TALLER)
          .getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarAprobadasPorEvaluador(Long evaluadorId) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT COUNT(a) FROM AsignacionEvaluacion a"
                  + BASE_WHERE_CIENTIFICO
                  + " AND a.evaluacion.recomendacion IN :recs",
              Long.class)
          .setParameter("id", evaluadorId)
          .setParameter("tipoTaller", TipoTrabajo.PROPUESTA_TALLER)
          .setParameter(
              "recs",
              List.of(
                  RecomendacionEvaluacion.APROBADO,
                  RecomendacionEvaluacion.APROBADO_CON_CORRECCIONES))
          .getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<AsignacionEvaluacion> listarPorTrabajo(Long trabajoId) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT a FROM AsignacionEvaluacion a JOIN FETCH a.evaluador LEFT JOIN FETCH a.evaluacion WHERE a.trabajo.id = :id",
              AsignacionEvaluacion.class)
          .setParameter("id", trabajoId)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public Optional<AsignacionEvaluacion> buscarActiva(Long trabajoId, Long evaluadorId) {
    EntityManager em = emConsulta();
    try {
      List<AsignacionEvaluacion> list =
          em.createQuery(
                  "SELECT a FROM AsignacionEvaluacion a WHERE a.trabajo.id = :t AND a.evaluador.id = :e",
                  AsignacionEvaluacion.class)
              .setParameter("t", trabajoId)
              .setParameter("e", evaluadorId)
              .getResultList();
      return list.stream().findFirst();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public Optional<AsignacionEvaluacion> recuperarPorIdConDetalle(Long id) {
    EntityManager em = emConsulta();
    try {
      List<AsignacionEvaluacion> list =
          em.createQuery(
                  "SELECT a FROM AsignacionEvaluacion a JOIN FETCH a.trabajo JOIN FETCH a.evaluador"
                      + " WHERE a.id = :id",
                  AsignacionEvaluacion.class)
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
