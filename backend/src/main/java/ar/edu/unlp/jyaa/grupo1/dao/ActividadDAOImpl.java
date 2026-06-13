package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;
import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Actividad;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.List;

@RequestScoped
public class ActividadDAOImpl extends AbstractJpaDAO<Actividad> implements ActividadDAO {

  public ActividadDAOImpl() {
    super(Actividad.class);
  }

  @Override
  public List<Actividad> listarTodos() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT a FROM Actividad a LEFT JOIN FETCH a.trabajos ORDER BY a.inicio", Actividad.class)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<Actividad> buscarConflictos(
      String sala, LocalDateTime inicio, LocalDateTime fin, Long excluirId) {
    EntityManager em = emConsulta();
    try {
      var q =
          em.createQuery(
              "SELECT a FROM Actividad a WHERE a.sala = :sala AND a.inicio < :fin AND a.fin > :inicio"
                  + (excluirId != null ? " AND a.id <> :excluir" : ""),
              Actividad.class);
      q.setParameter("sala", sala);
      q.setParameter("inicio", inicio);
      q.setParameter("fin", fin);
      if (excluirId != null) {
        q.setParameter("excluir", excluirId);
      }
      return q.getResultList();
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
