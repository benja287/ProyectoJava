package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;
import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.CronogramaPersonal;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;

@RequestScoped
public class CronogramaPersonalDAOImpl extends AbstractJpaDAO<CronogramaPersonal>
    implements CronogramaPersonalDAO {

  public CronogramaPersonalDAOImpl() {
    super(CronogramaPersonal.class);
  }

  @Override
  public List<CronogramaPersonal> listarTodos() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT c FROM CronogramaPersonal c JOIN FETCH c.usuario LEFT JOIN FETCH c.actividades",
              CronogramaPersonal.class)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public Optional<CronogramaPersonal> buscarPorUsuarioId(Long usuarioId) {
    EntityManager em = emConsulta();
    try {
      List<CronogramaPersonal> list =
          em.createQuery(
                  "SELECT c FROM CronogramaPersonal c JOIN FETCH c.usuario LEFT JOIN FETCH c.actividades"
                      + " WHERE c.usuario.id = :id",
                  CronogramaPersonal.class)
              .setParameter("id", usuarioId)
              .getResultList();
      return list.stream().findFirst();
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
