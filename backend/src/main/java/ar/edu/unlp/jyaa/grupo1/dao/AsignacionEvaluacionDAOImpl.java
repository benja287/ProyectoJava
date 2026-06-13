package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;
import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;

@RequestScoped
public class AsignacionEvaluacionDAOImpl extends AbstractJpaDAO<AsignacionEvaluacion>
    implements AsignacionEvaluacionDAO {

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
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT a FROM AsignacionEvaluacion a JOIN FETCH a.trabajo WHERE a.evaluador.id = :id",
              AsignacionEvaluacion.class)
          .setParameter("id", evaluadorId)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<AsignacionEvaluacion> listarPorTrabajo(Long trabajoId) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT a FROM AsignacionEvaluacion a JOIN FETCH a.evaluador WHERE a.trabajo.id = :id",
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
