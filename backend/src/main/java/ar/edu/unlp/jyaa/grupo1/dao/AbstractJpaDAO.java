package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityTransaction;
import java.util.List;

public abstract class AbstractJpaDAO<T> implements GenericDAO<T> {

  private final Class<T> entityClass;
  private final String entityName;

  protected AbstractJpaDAO(Class<T> entityClass) {
    this.entityClass = entityClass;
    this.entityName = entityClass.getSimpleName();
  }

  @Override
  public T alta(T entidad) {
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

  @Override
  public T modificar(T entidad) {
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
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.find(entityClass, id);
    } finally {
      em.close();
    }
  }

  @Override
  public List<T> listarTodos() {
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.createQuery("SELECT e FROM " + entityName + " e", entityClass).getResultList();
    } finally {
      em.close();
    }
  }
}
