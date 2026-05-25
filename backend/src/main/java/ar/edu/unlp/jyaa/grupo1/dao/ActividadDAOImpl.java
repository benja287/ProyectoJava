package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import jakarta.persistence.EntityManager;
import java.util.List;

public class ActividadDAOImpl extends AbstractJpaDAO<Actividad> implements ActividadDAO {

  public ActividadDAOImpl() {
    super(Actividad.class);
  }

  @Override
  public List<Actividad> listarTodos() {
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.createQuery(
              "SELECT a FROM Actividad a LEFT JOIN FETCH a.trabajos", Actividad.class)
          .getResultList();
    } finally {
      em.close();
    }
  }
}
