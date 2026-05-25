package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityTransaction;
import java.time.LocalDate;

/**
 * Orquestador de negocio del diagrama UML {@code SistemaGestionCongreso} (no es entidad JPA).
 * Centraliza operaciones que en el diseño de la entrega 2 estaban en un solo controlador.
 */
public class SistemaGestionCongresoService {

  public Trabajo postularTrabajo(Trabajo trabajo) {
    EntityManager em = JpaUtil.createEntityManager();
    EntityTransaction tx = em.getTransaction();
    try {
      tx.begin();
      trabajo.setEstado(EstadoTrabajo.ENVIADO);
      if (trabajo.getFechaCreacion() == null) {
        trabajo.setFechaCreacion(LocalDate.now());
      }
      em.persist(trabajo);
      tx.commit();
      return trabajo;
    } catch (RuntimeException e) {
      if (tx.isActive()) {
        tx.rollback();
      }
      throw e;
    } finally {
      em.close();
    }
  }

  public AsignacionEvaluacion asignarEvaluador(Long trabajoId, Long evaluadorId) {
    EntityManager em = JpaUtil.createEntityManager();
    EntityTransaction tx = em.getTransaction();
    try {
      tx.begin();
      Trabajo trabajo = em.find(Trabajo.class, trabajoId);
      Usuario evaluador = em.find(Usuario.class, evaluadorId);
      AsignacionEvaluacion asignacion = new AsignacionEvaluacion();
      asignacion.setTrabajo(trabajo);
      asignacion.setEvaluador(evaluador);
      asignacion.setAceptada(false);
      trabajo.setEstado(EstadoTrabajo.EN_EVALUACION);
      em.persist(asignacion);
      tx.commit();
      return asignacion;
    } catch (RuntimeException e) {
      if (tx.isActive()) {
        tx.rollback();
      }
      throw e;
    } finally {
      em.close();
    }
  }

  public Evaluacion registrarEvaluacion(
      Long asignacionId, RecomendacionEvaluacion recomendacion, String comentario) {
    EntityManager em = JpaUtil.createEntityManager();
    EntityTransaction tx = em.getTransaction();
    try {
      tx.begin();
      AsignacionEvaluacion asignacion = em.find(AsignacionEvaluacion.class, asignacionId);
      Evaluacion evaluacion = new Evaluacion();
      evaluacion.setAsignacion(asignacion);
      evaluacion.setRecomendacion(recomendacion);
      evaluacion.setComentario(comentario);
      evaluacion.setFecha(LocalDate.now());
      asignacion.setEvaluacion(evaluacion);
      asignacion.setAceptada(true);
      asignacion.setFechaRespuesta(LocalDate.now());
      em.persist(evaluacion);
      tx.commit();
      return evaluacion;
    } catch (RuntimeException e) {
      if (tx.isActive()) {
        tx.rollback();
      }
      throw e;
    } finally {
      em.close();
    }
  }

  public InscripcionCongreso registrarInscripcion(InscripcionCongreso inscripcion) {
    EntityManager em = JpaUtil.createEntityManager();
    EntityTransaction tx = em.getTransaction();
    try {
      tx.begin();
      if (inscripcion.getFechaSolicitud() == null) {
        inscripcion.setFechaSolicitud(LocalDate.now());
      }
      em.persist(inscripcion);
      tx.commit();
      return inscripcion;
    } catch (RuntimeException e) {
      if (tx.isActive()) {
        tx.rollback();
      }
      throw e;
    } finally {
      em.close();
    }
  }

  public Circular publicarCircular(Circular circular) {
    EntityManager em = JpaUtil.createEntityManager();
    EntityTransaction tx = em.getTransaction();
    try {
      tx.begin();
      circular.setPublicada(true);
      if (circular.getFechaPublicacion() == null) {
        circular.setFechaPublicacion(LocalDate.now());
      }
      em.persist(circular);
      tx.commit();
      return circular;
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
