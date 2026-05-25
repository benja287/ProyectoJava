package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.AsignacionEvaluacion;
import jakarta.persistence.EntityManager;
import java.util.List;

public class AsignacionEvaluacionDAOImpl extends AbstractJpaDAO<AsignacionEvaluacion>
    implements AsignacionEvaluacionDAO {

  public AsignacionEvaluacionDAOImpl() {
    super(AsignacionEvaluacion.class);
  }

  @Override
  public List<AsignacionEvaluacion> listarTodos() {
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.createQuery(
              "SELECT a FROM AsignacionEvaluacion a JOIN FETCH a.trabajo JOIN FETCH a.evaluador",
              AsignacionEvaluacion.class)
          .getResultList();
    } finally {
      em.close();
    }
  }
}
