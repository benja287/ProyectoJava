package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityTransaction;
import java.util.List;

/**
 * Base DAO con doble modo: CDI ({@link EntityManager} inyectado por request) o legacy ({@code new} +
 * {@link JpaUtil} para {@link ar.edu.unlp.jyaa.grupo1.test.PersistenciaAbmTests}).
 */
public abstract class AbstractJpaDAO<T> implements GenericDAO<T> {

  private final Class<T> entityClass;
  private final String entityName;

  @Inject
  private EntityManager injectedEm;

  protected AbstractJpaDAO(Class<T> entityClass) {
    this.entityClass = entityClass;
    this.entityName = entityClass.getSimpleName();
  }

  protected EntityManager getEntityManager() {
    return injectedEm;
  }

  private boolean usesCdi() {
    return injectedEm != null;
  }

  @Override
  public T alta(T entidad) {
    if (usesCdi()) {
      injectedEm.persist(entidad);
      return entidad;
    }
    EntityManager em = JpaUtil.createEntityManager();
    EntityTransaction tx = em.getTransaction();
    try {
      tx.begin();
      em.persist(entidad);
      tx.commit();
      return entidad;
    } catch (RuntimeException e) {
      if (tx.isActive()) {
        tx.rollback();
      }
      throw e;
    } finally {
      em.close();
    }
  }

  @Override
  public void baja(Long id) {
    if (usesCdi()) {
      T found = injectedEm.find(entityClass, id);
      if (found != null) {
        injectedEm.remove(found);
      }
      return;
    }
    EntityManager em = JpaUtil.createEntityManager();
    EntityTransaction tx = em.getTransaction();
    try {
      tx.begin();
      T found = em.find(entityClass, id);
      if (found != null) {
        em.remove(found);
      }
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

  public void flush() {
    if (usesCdi()) {
      injectedEm.flush();
    }
  }

  @Override
  public T modificar(T entidad) {
    if (usesCdi()) {
      return injectedEm.merge(entidad);
    }
    EntityManager em = JpaUtil.createEntityManager();
    EntityTransaction tx = em.getTransaction();
    try {
      tx.begin();
      T merged = em.merge(entidad);
      tx.commit();
      return merged;
    } catch (RuntimeException e) {
      if (tx.isActive()) {
        tx.rollback();
      }
      throw e;
    } finally {
      em.close();
    }
  }

  @Override
  public T recuperarPorId(Long id) {
    if (usesCdi()) {
      return injectedEm.find(entityClass, id);
    }
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.find(entityClass, id);
    } finally {
      em.close();
    }
  }

  @Override
  public List<T> listarTodos() {
    if (usesCdi()) {
      return injectedEm
          .createQuery("SELECT e FROM " + entityName + " e", entityClass)
          .getResultList();
    }
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.createQuery("SELECT e FROM " + entityName + " e", entityClass).getResultList();
    } finally {
      em.close();
    }
  }
}
