package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.CronogramaPersonal;
import jakarta.persistence.EntityManager;
import java.util.List;

public class CronogramaPersonalDAOImpl extends AbstractJpaDAO<CronogramaPersonal>
    implements CronogramaPersonalDAO {

  public CronogramaPersonalDAOImpl() {
    super(CronogramaPersonal.class);
  }

  @Override
  public List<CronogramaPersonal> listarTodos() {
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.createQuery(
              "SELECT c FROM CronogramaPersonal c JOIN FETCH c.usuario LEFT JOIN FETCH c.actividades",
              CronogramaPersonal.class)
          .getResultList();
    } finally {
      em.close();
    }
  }
}
