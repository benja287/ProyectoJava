package ar.edu.unlp.jyaa.grupo1.config;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.RequestScoped;
import jakarta.enterprise.inject.Disposes;
import jakarta.enterprise.inject.Produces;
import jakarta.persistence.EntityManager;

@ApplicationScoped
public class EntityManagerProducer {

  @Produces
  @RequestScoped
  public EntityManager createEntityManager() {
    EntityManager em = JpaUtil.getEntityManagerFactory().createEntityManager();
    em.getTransaction().begin();
    return em;
  }

  public void dispose(@Disposes EntityManager em) {
    try {
      if (em.getTransaction().isActive()) {
        em.flush();
        em.getTransaction().commit();
      }
    } catch (RuntimeException e) {
      if (em.getTransaction().isActive()) {
        em.getTransaction().rollback();
      }
      throw e;
    } finally {
      if (em.isOpen()) {
        em.close();
      }
    }
  }
}
