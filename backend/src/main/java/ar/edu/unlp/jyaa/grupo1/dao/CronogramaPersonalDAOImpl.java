package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;
import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.CronogramaPersonal;
import jakarta.persistence.EntityManager;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
                  "SELECT DISTINCT c FROM CronogramaPersonal c JOIN FETCH c.usuario"
                      + " LEFT JOIN FETCH c.actividades a LEFT JOIN FETCH a.aula"
                      + " WHERE c.usuario.id = :id",
                  CronogramaPersonal.class)
              .setParameter("id", usuarioId)
              .getResultList();
      return list.stream().findFirst();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public long contarAgendasConActividad(Long actividadId) {
    EntityManager em = emConsulta();
    try {
      Long count =
          em.createQuery(
                  "SELECT COUNT(c) FROM CronogramaPersonal c JOIN c.actividades a"
                      + " WHERE a.id = :actividadId",
                  Long.class)
              .setParameter("actividadId", actividadId)
              .getSingleResult();
      return count != null ? count : 0L;
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public Map<Long, Long> contarAgendasPorActividadIds(Collection<Long> actividadIds) {
    if (actividadIds == null || actividadIds.isEmpty()) {
      return Collections.emptyMap();
    }
    EntityManager em = emConsulta();
    try {
      List<Object[]> rows =
          em.createQuery(
                  "SELECT a.id, COUNT(c) FROM CronogramaPersonal c JOIN c.actividades a"
                      + " WHERE a.id IN :ids GROUP BY a.id",
                  Object[].class)
              .setParameter("ids", actividadIds)
              .getResultList();
      Map<Long, Long> out = new HashMap<>();
      for (Object[] row : rows) {
        if (row[0] != null) {
          out.put((Long) row[0], row[1] != null ? (Long) row[1] : 0L);
        }
      }
      return out;
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
