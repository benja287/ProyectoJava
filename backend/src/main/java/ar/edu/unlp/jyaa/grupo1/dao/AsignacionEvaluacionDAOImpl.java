package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.AsignacionEvaluadorFiltro;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.JpqlLikeFilters;
import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.RecomendacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoTrabajo;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
              "SELECT DISTINCT a FROM AsignacionEvaluacion a"
                  + " JOIN FETCH a.trabajo JOIN FETCH a.evaluador"
                  + " LEFT JOIN FETCH a.evaluacion",
              AsignacionEvaluacion.class)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<AsignacionEvaluacion> listarPorEvaluador(Long evaluadorId) {
    return listarPorEvaluadorPaginado(
        evaluadorId, false, AsignacionEvaluadorFiltro.vacio(), 0, 500);
  }

  @Override
  public List<AsignacionEvaluacion> listarPorEvaluadorPaginado(
      Long evaluadorId,
      boolean soloPendientes,
      AsignacionEvaluadorFiltro filtro,
      int offset,
      int limit) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String idsJpql =
          buildWhere(
                  "SELECT a.id FROM AsignacionEvaluacion a",
                  soloPendientes,
                  filtro,
                  params)
              + " ORDER BY a.id DESC";
      TypedQuery<Long> idsQuery = em.createQuery(idsJpql, Long.class);
      bindBaseParams(idsQuery, evaluadorId, soloPendientes, params);
      List<Long> ids = idsQuery.setFirstResult(offset).setMaxResults(limit).getResultList();
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
  public long contarPorEvaluador(
      Long evaluadorId, boolean soloPendientes, AsignacionEvaluadorFiltro filtro) {
    EntityManager em = emConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql =
          buildWhere("SELECT COUNT(a) FROM AsignacionEvaluacion a", soloPendientes, filtro, params);
      TypedQuery<Long> q = em.createQuery(jpql, Long.class);
      bindBaseParams(q, evaluadorId, soloPendientes, params);
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
          .setParameter("tipoTaller", TipoTrabajo.PROPUESTA_TALLER.name())
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
          .setParameter("tipoTaller", TipoTrabajo.PROPUESTA_TALLER.name())
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

  @Override
  public long contarPendientesDictamenPorEvaluadorYEje(Long evaluadorId, String ejeTematico) {
    if (evaluadorId == null || ejeTematico == null || ejeTematico.isBlank()) {
      return 0;
    }
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT COUNT(a) FROM AsignacionEvaluacion a"
                  + " WHERE a.evaluador.id = :eid"
                  + " AND a.trabajo.ejeTematico = :eje"
                  + " AND a.evaluacion IS NULL"
                  + " AND (a.fechaRespuesta IS NULL OR a.aceptada = true)",
              Long.class)
          .setParameter("eid", evaluadorId)
          .setParameter("eje", ejeTematico.trim())
          .getSingleResult();
    } finally {
      closeLegacy(em);
    }
  }

  private static String buildWhere(
      String select,
      boolean soloPendientes,
      AsignacionEvaluadorFiltro filtro,
      Map<String, Object> params) {
    StringBuilder jpql = new StringBuilder(select).append(BASE_WHERE_CIENTIFICO);
    if (soloPendientes) {
      jpql.append(PENDIENTE_WHERE);
    }
    AsignacionEvaluadorFiltro f =
        filtro != null ? filtro : AsignacionEvaluadorFiltro.vacio();
    if (f.tipo() != null) {
      jpql.append(" AND a.trabajo.tipo = :filtroTipo");
      params.put("filtroTipo", f.tipo());
    }
    if (f.modalidad() != null) {
      jpql.append(" AND a.trabajo.modalidad = :filtroModalidad");
      params.put("filtroModalidad", f.modalidad());
    }
    JpqlLikeFilters.appendLike(
        jpql, params, "a.trabajo.ejeTematico", "filtroEje", f.ejeTematico());
    if (f.estado() != null) {
      jpql.append(" AND a.trabajo.estado = :filtroEstado");
      params.put("filtroEstado", f.estado());
    }
    return jpql.toString();
  }

  private static void bindBaseParams(
      TypedQuery<?> q, Long evaluadorId, boolean soloPendientes, Map<String, Object> params) {
    q.setParameter("id", evaluadorId);
    q.setParameter("tipoTaller", TipoTrabajo.PROPUESTA_TALLER.name());
    if (soloPendientes) {
      q.setParameter(
          "estadosCerrados",
          List.of(
              EstadoTrabajo.RECHAZADO,
              EstadoTrabajo.APROBADO,
              EstadoTrabajo.PENDIENTE_APROBACION_COMITE,
              EstadoTrabajo.OBSERVADO_EVALUACION));
    }
    params.forEach(q::setParameter);
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
