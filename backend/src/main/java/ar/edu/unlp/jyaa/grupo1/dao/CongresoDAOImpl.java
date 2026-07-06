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

  @Override
  public Congreso obtenerPrincipal() {
    EntityManager em = getEntityManager();
    if (em != null) {
      List<Congreso> list =
          em.createQuery("SELECT c FROM Congreso c ORDER BY c.id DESC", Congreso.class)
              .setMaxResults(1)
              .getResultList();
      if (!list.isEmpty()) {
        return list.getFirst();
      }
      Congreso c = new Congreso();
      c.setNombre("Congreso Argentino de Agroecología");
      c.setEdicion("V");
      em.persist(c);
      return c;
    }
    EntityManager legacy = JpaUtil.createEntityManager();
    try {
      List<Congreso> list =
          legacy
              .createQuery("SELECT c FROM Congreso c ORDER BY c.id DESC", Congreso.class)
              .setMaxResults(1)
              .getResultList();
      if (!list.isEmpty()) {
        return list.getFirst();
      }
      Congreso c = new Congreso();
      c.setNombre("Congreso Argentino de Agroecología");
      c.setEdicion("V");
      legacy.getTransaction().begin();
      legacy.persist(c);
      legacy.getTransaction().commit();
      return c;
    } finally {
      legacy.close();
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
