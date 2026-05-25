package ar.edu.unlp.jyaa.grupo1.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityTransaction;
import jakarta.persistence.Persistence;

/**
 * Acceso central al EntityManagerFactory (unidad de persistencia jyaaPU).
 */
public final class JpaUtil {

  public static final String PERSISTENCE_UNIT = "jyaaPU";

  private static EntityManagerFactory emf;

  private JpaUtil() {}

  public static synchronized EntityManagerFactory getEntityManagerFactory() {
    if (emf == null || !emf.isOpen()) {
      emf = Persistence.createEntityManagerFactory(PERSISTENCE_UNIT);
    }
    return emf;
  }

  public static EntityManager createEntityManager() {
    return getEntityManagerFactory().createEntityManager();
  }

  public static synchronized void shutdown() {
    if (emf != null && emf.isOpen()) {
      emf.close();
      emf = null;
    }
  }

  /** Transacción única (casos de prueba con varias entidades relacionadas). */
  public static void ejecutarEnTransaccion(java.util.function.Consumer<EntityManager> trabajo) {
    EntityManager em = createEntityManager();
    EntityTransaction tx = em.getTransaction();
    try {
      tx.begin();
      trabajo.accept(em);
      tx.commit();
    } catch (RuntimeException e) {
      if (tx.isActive()) {
        tx.rollback();
      }
      throw e;
    } finally {
      em.close();
    }
  }
}
