package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.FranjaHoraria;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import java.time.LocalTime;
import java.util.List;

@RequestScoped
public class FranjaHorariaDAOImpl extends AbstractJpaDAO<FranjaHoraria> implements FranjaHorariaDAO {

  public FranjaHorariaDAOImpl() {
    super(FranjaHoraria.class);
  }

  @Override
  public List<FranjaHoraria> listarTodas() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT f FROM FranjaHoraria f ORDER BY f.diaCongreso, f.horaInicio",
              FranjaHoraria.class)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<FranjaHoraria> listarActivas() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT f FROM FranjaHoraria f WHERE f.activa = true"
                  + " ORDER BY f.diaCongreso, f.horaInicio",
              FranjaHoraria.class)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<FranjaHoraria> listarActivasPorDia(int diaCongreso) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT f FROM FranjaHoraria f WHERE f.activa = true AND f.diaCongreso = :dia"
                  + " ORDER BY f.horaInicio",
              FranjaHoraria.class)
          .setParameter("dia", diaCongreso)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public boolean existeSolapeActivo(
      int diaCongreso, LocalTime inicio, LocalTime fin, Long excludeId) {
    EntityManager em = emConsulta();
    try {
      String jpql =
          "SELECT COUNT(f) FROM FranjaHoraria f WHERE f.activa = true"
              + " AND f.diaCongreso = :dia"
              + " AND f.horaInicio < :fin AND f.horaFin > :inicio";
      if (excludeId != null) {
        jpql += " AND f.id <> :excludeId";
      }
      var q =
          em.createQuery(jpql, Long.class)
              .setParameter("dia", diaCongreso)
              .setParameter("inicio", inicio)
              .setParameter("fin", fin);
      if (excludeId != null) {
        q.setParameter("excludeId", excludeId);
      }
      Long count = q.getSingleResult();
      return count != null && count > 0;
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
