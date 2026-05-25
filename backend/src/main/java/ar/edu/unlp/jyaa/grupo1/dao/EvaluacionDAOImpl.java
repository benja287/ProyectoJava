package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Evaluacion;
import jakarta.persistence.EntityManager;
import java.util.List;

public class EvaluacionDAOImpl extends AbstractJpaDAO<Evaluacion> implements EvaluacionDAO {

  public EvaluacionDAOImpl() {
    super(Evaluacion.class);
  }

  @Override
  public List<Evaluacion> listarTodos() {
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.createQuery(
              "SELECT e FROM Evaluacion e JOIN FETCH e.asignacion", Evaluacion.class)
          .getResultList();
    } finally {
      em.close();
    }
  }
}
