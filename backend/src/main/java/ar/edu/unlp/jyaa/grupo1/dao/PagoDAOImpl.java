package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;
import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.EstadoPago;
import ar.edu.unlp.jyaa.grupo1.modelo.Pago;
import jakarta.persistence.EntityManager;
import java.util.List;

@RequestScoped
public class PagoDAOImpl extends AbstractJpaDAO<Pago> implements PagoDAO {

  public PagoDAOImpl() {
    super(Pago.class);
  }

  @Override
  public List<Pago> listarPorEstado(EstadoPago estado) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery("SELECT p FROM Pago p WHERE p.estado = :e ORDER BY p.id DESC", Pago.class)
          .setParameter("e", estado)
          .getResultList();
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
