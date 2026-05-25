package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Notificacion;
import jakarta.persistence.EntityManager;
import java.util.List;

public class NotificacionDAOImpl extends AbstractJpaDAO<Notificacion> implements NotificacionDAO {

  public NotificacionDAOImpl() {
    super(Notificacion.class);
  }

  @Override
  public List<Notificacion> listarTodos() {
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.createQuery(
              "SELECT n FROM Notificacion n JOIN FETCH n.usuario ORDER BY n.fechaCreacion DESC",
              Notificacion.class)
          .getResultList();
    } finally {
      em.close();
    }
  }
}
