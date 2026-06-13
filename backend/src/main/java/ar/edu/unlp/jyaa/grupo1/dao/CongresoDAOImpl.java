package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Congreso;
import jakarta.persistence.EntityManager;
import java.util.List;

@RequestScoped
public class CongresoDAOImpl extends AbstractJpaDAO<Congreso> implements CongresoDAO {

  public CongresoDAOImpl() {
    super(Congreso.class);
  }

  @Override
  public List<Congreso> listarTodos() {
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.createQuery(
              "SELECT c FROM Congreso c LEFT JOIN FETCH c.etapas", Congreso.class)
          .getResultList();
    } finally {
      em.close();
    }
  }
}
