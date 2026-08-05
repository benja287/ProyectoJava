package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.JpqlLikeFilters;
import ar.edu.unlp.jyaa.grupo1.dao.filtro.UsuarioFiltro;
import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import ar.edu.unlp.jyaa.grupo1.modelo.CronogramaPersonal;
import ar.edu.unlp.jyaa.grupo1.modelo.SolicitudEvaluador;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RequestScoped
public class UsuarioDAOImpl extends AbstractJpaDAO<Usuario> implements UsuarioDAO {

  public UsuarioDAOImpl() {
    super(Usuario.class);
  }

  @Override
  public List<Usuario> listarTodos() {
    EntityManager em = entityManagerParaConsulta();
    try {
      return em.createQuery(
              "SELECT u FROM Usuario u LEFT JOIN FETCH u.roles ORDER BY u.apellido", Usuario.class)
          .getResultList();
    } finally {
      cerrarSiLegacy(em);
    }
  }

  @Override
  public List<Usuario> listarPaginado(int offset, int limit) {
    EntityManager em = entityManagerParaConsulta();
    try {
      return em.createQuery(
              "SELECT u FROM Usuario u LEFT JOIN FETCH u.roles ORDER BY u.apellido", Usuario.class)
          .setFirstResult(offset)
          .setMaxResults(limit)
          .getResultList();
    } finally {
      cerrarSiLegacy(em);
    }
  }

  @Override
  public long contar() {
    EntityManager em = entityManagerParaConsulta();
    try {
      return em.createQuery("SELECT COUNT(u) FROM Usuario u", Long.class).getSingleResult();
    } finally {
      cerrarSiLegacy(em);
    }
  }

  @Override
  public Optional<Usuario> buscarPorEmail(String email) {
    EntityManager em = entityManagerParaConsulta();
    try {
      List<Usuario> list =
          em.createQuery("SELECT u FROM Usuario u WHERE u.email = :email", Usuario.class)
              .setParameter("email", email)
              .getResultList();
      return list.stream().findFirst();
    } finally {
      cerrarSiLegacy(em);
    }
  }

  @Override
  public List<Usuario> listarConExcepcionCupoEnvio(int offset, int limit) {
    EntityManager em = entityManagerParaConsulta();
    try {
      return em.createQuery(
              """
              SELECT u FROM Usuario u
              WHERE u.maxTrabajosAutorOverride IS NOT NULL
                 OR u.maxTrabajosAsistenteOverride IS NOT NULL
              ORDER BY u.apellido, u.nombre
              """,
              Usuario.class)
          .setFirstResult(Math.max(0, offset))
          .setMaxResults(Math.max(1, limit))
          .getResultList();
    } finally {
      cerrarSiLegacy(em);
    }
  }

  @Override
  public long contarConExcepcionCupoEnvio() {
    EntityManager em = entityManagerParaConsulta();
    try {
      return em.createQuery(
              """
              SELECT COUNT(u) FROM Usuario u
              WHERE u.maxTrabajosAutorOverride IS NOT NULL
                 OR u.maxTrabajosAsistenteOverride IS NOT NULL
              """,
              Long.class)
          .getSingleResult();
    } finally {
      cerrarSiLegacy(em);
    }
  }

  @Override
  public Optional<Boolean> isActivoById(Long id) {
    EntityManager em = entityManagerParaConsulta();
    try {
      List<Boolean> list =
          em.createQuery("SELECT u.activo FROM Usuario u WHERE u.id = :id", Boolean.class)
              .setParameter("id", id)
              .getResultList();
      return list.stream().findFirst();
    } finally {
      cerrarSiLegacy(em);
    }
  }

  @Override
  public List<Usuario> listarFiltrado(UsuarioFiltro filtro, int offset, int limit) {
    EntityManager em = entityManagerParaConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql = buildUsuarioWhere("SELECT u FROM Usuario u LEFT JOIN FETCH u.roles", filtro, params);
      jpql += " ORDER BY u.apellido";
      TypedQuery<Usuario> q = em.createQuery(jpql, Usuario.class);
      params.forEach(q::setParameter);
      return q.setFirstResult(offset).setMaxResults(limit).getResultList();
    } finally {
      cerrarSiLegacy(em);
    }
  }

  @Override
  public long contarFiltrado(UsuarioFiltro filtro) {
    EntityManager em = entityManagerParaConsulta();
    try {
      Map<String, Object> params = new HashMap<>();
      String jpql = buildUsuarioWhere("SELECT COUNT(u) FROM Usuario u", filtro, params);
      TypedQuery<Long> q = em.createQuery(jpql, Long.class);
      params.forEach(q::setParameter);
      return q.getSingleResult();
    } finally {
      cerrarSiLegacy(em);
    }
  }

  private static String buildUsuarioWhere(
      String select, UsuarioFiltro filtro, Map<String, Object> params) {
    StringBuilder jpql = new StringBuilder(select).append(" WHERE 1=1");
    JpqlLikeFilters.appendLike(jpql, params, "u.apellido", "apellido", filtro.apellido());
    JpqlLikeFilters.appendLike(jpql, params, "u.nombre", "nombre", filtro.nombre());
    JpqlLikeFilters.appendLike(jpql, params, "u.email", "email", filtro.email());
    if (filtro.activo() != null) {
      jpql.append(" AND u.activo = :activo");
      params.put("activo", filtro.activo());
    }
    if (filtro.soloEvaluadores() != null) {
      if (Boolean.TRUE.equals(filtro.soloEvaluadores())) {
        jpql.append(
            " AND (EXISTS (SELECT 1 FROM EvaluadorEjeCapacidad c WHERE c.usuario = u AND c.activo = true)"
                + " OR (u.ejeTematicoEvaluador IS NOT NULL AND TRIM(u.ejeTematicoEvaluador) <> ''))");
      } else {
        jpql.append(
            " AND NOT EXISTS (SELECT 1 FROM EvaluadorEjeCapacidad c WHERE c.usuario = u AND c.activo = true)"
                + " AND (u.ejeTematicoEvaluador IS NULL OR TRIM(u.ejeTematicoEvaluador) = '')");
      }
    }
    if (filtro.ejeTematicoEvaluador() != null && !filtro.ejeTematicoEvaluador().isBlank()) {
      jpql.append(
          " AND (u.ejeTematicoEvaluador = :ejeTematicoEvaluador"
              + " OR EXISTS (SELECT 1 FROM EvaluadorEjeCapacidad c2 WHERE c2.usuario = u"
              + " AND c2.activo = true AND c2.ejeTematico = :ejeTematicoEvaluador))");
      params.put("ejeTematicoEvaluador", filtro.ejeTematicoEvaluador().trim());
    }
    return jpql.toString();
  }

  private EntityManager entityManagerParaConsulta() {
    EntityManager cdi = getEntityManager();
    return cdi != null ? cdi : JpaUtil.createEntityManager();
  }

  private void cerrarSiLegacy(EntityManager em) {
    if (getEntityManager() == null) {
      em.close();
    }
  }

  @Override
  public long contarEvaluadoresPorEje(String ejeTematico, Long excluirUsuarioId) {
    EntityManager em = entityManagerParaConsulta();
    try {
      StringBuilder jpql =
          new StringBuilder(
              "SELECT COUNT(DISTINCT u) FROM Usuario u JOIN u.roles r WHERE r = ar.edu.unlp.jyaa.grupo1.modelo.Rol.EVALUADOR"
                  + " AND (u.ejeTematicoEvaluador = :eje"
                  + " OR EXISTS (SELECT 1 FROM EvaluadorEjeCapacidad c WHERE c.usuario = u"
                  + " AND c.activo = true AND c.ejeTematico = :eje))");
      if (excluirUsuarioId != null) {
        jpql.append(" AND u.id <> :excluirId");
      }
      TypedQuery<Long> q = em.createQuery(jpql.toString(), Long.class).setParameter("eje", ejeTematico);
      if (excluirUsuarioId != null) {
        q.setParameter("excluirId", excluirUsuarioId);
      }
      return q.getSingleResult();
    } finally {
      cerrarSiLegacy(em);
    }
  }

  @Override
  public void eliminarConDependencias(Long usuarioId) {
    EntityManager cdi = getEntityManager();
    if (cdi != null) {
      borrarDependenciasYUsuario(cdi, usuarioId);
      return;
    }
    EntityManager em = JpaUtil.createEntityManager();
    var tx = em.getTransaction();
    try {
      tx.begin();
      borrarDependenciasYUsuario(em, usuarioId);
      tx.commit();
    } catch (RuntimeException e) {
      if (tx.isActive()) {
        tx.rollback();
      }
      throw e;
    } finally {
      em.close();
    }
  }

  private static void borrarDependenciasYUsuario(EntityManager em, Long usuarioId) {
    // Auditoría: el registro queda, pero deja de apuntar al usuario borrado.
    ejecutar(em, "UPDATE Pago p SET p.validadoPor = NULL WHERE p.validadoPor.id = :uid", usuarioId);
    ejecutar(
        em,
        "UPDATE SolicitudEvaluador s SET s.revisadoPor = NULL WHERE s.revisadoPor.id = :uid",
        usuarioId);

    ejecutar(em, "DELETE FROM EvaluadorEjeCapacidad c WHERE c.usuario.id = :uid", usuarioId);
    ejecutar(em, "DELETE FROM Notificacion n WHERE n.usuario.id = :uid", usuarioId);
    ejecutar(em, "DELETE FROM Certificado c WHERE c.usuario.id = :uid", usuarioId);

    // Estas entidades tienen colecciones o entidades hijas: se borran por entidad para que
    // JPA limpie también sus tablas de relación.
    em.createQuery(
            "SELECT s FROM SolicitudEvaluador s WHERE s.usuario.id = :uid",
            SolicitudEvaluador.class)
        .setParameter("uid", usuarioId)
        .getResultList()
        .forEach(em::remove);
    em.createQuery(
            "SELECT a FROM AsignacionEvaluacion a WHERE a.evaluador.id = :uid",
            AsignacionEvaluacion.class)
        .setParameter("uid", usuarioId)
        .getResultList()
        .forEach(em::remove);
    em.createQuery(
            "SELECT c FROM CronogramaPersonal c WHERE c.usuario.id = :uid",
            CronogramaPersonal.class)
        .setParameter("uid", usuarioId)
        .getResultList()
        .forEach(em::remove);
    em.flush();

    Usuario usuario = em.find(Usuario.class, usuarioId);
    if (usuario != null) {
      em.remove(usuario);
    }
  }

  private static void ejecutar(EntityManager em, String jpql, Long usuarioId) {
    em.createQuery(jpql).setParameter("uid", usuarioId).executeUpdate();
  }

  @Override
  public void flush() {
    super.flush();
  }
}
