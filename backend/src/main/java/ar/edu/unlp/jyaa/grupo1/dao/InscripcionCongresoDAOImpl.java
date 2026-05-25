package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import jakarta.persistence.EntityManager;
import java.util.List;

public class InscripcionCongresoDAOImpl extends AbstractJpaDAO<InscripcionCongreso>
    implements InscripcionCongresoDAO {

  public InscripcionCongresoDAOImpl() {
    super(InscripcionCongreso.class);
  }

  @Override
  public List<InscripcionCongreso> listarTodos() {
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.createQuery(
              "SELECT i FROM InscripcionCongreso i JOIN FETCH i.usuario LEFT JOIN FETCH i.pago",
              InscripcionCongreso.class)
          .getResultList();
    } finally {
      em.close();
    }
  }
}
