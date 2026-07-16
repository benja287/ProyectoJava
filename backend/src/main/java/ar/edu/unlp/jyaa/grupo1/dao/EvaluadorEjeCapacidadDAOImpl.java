package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.EvaluadorEjeCapacidad;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@RequestScoped
public class EvaluadorEjeCapacidadDAOImpl extends AbstractJpaDAO<EvaluadorEjeCapacidad>
    implements EvaluadorEjeCapacidadDAO {

  public EvaluadorEjeCapacidadDAOImpl() {
    super(EvaluadorEjeCapacidad.class);
  }

  @Override
  public Optional<EvaluadorEjeCapacidad> buscarPorUsuarioYEje(Long usuarioId, String ejeTematico) {
    EntityManager em = emConsulta();
    try {
      List<EvaluadorEjeCapacidad> list =
          em.createQuery(
                  "SELECT e FROM EvaluadorEjeCapacidad e WHERE e.usuario.id = :uid AND e.ejeTematico = :eje",
                  EvaluadorEjeCapacidad.class)
              .setParameter("uid", usuarioId)
              .setParameter("eje", ejeTematico)
              .setMaxResults(1)
              .getResultList();
      return list.stream().findFirst();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<EvaluadorEjeCapacidad> listarPorUsuario(Long usuarioId) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT e FROM EvaluadorEjeCapacidad e WHERE e.usuario.id = :uid ORDER BY e.ejeTematico",
              EvaluadorEjeCapacidad.class)
          .setParameter("uid", usuarioId)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<EvaluadorEjeCapacidad> listarActivosPorUsuario(Long usuarioId) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT e FROM EvaluadorEjeCapacidad e WHERE e.usuario.id = :uid AND e.activo = true ORDER BY e.ejeTematico",
              EvaluadorEjeCapacidad.class)
          .setParameter("uid", usuarioId)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<EvaluadorEjeCapacidad> listarPorUsuarios(Collection<Long> usuarioIds) {
    if (usuarioIds == null || usuarioIds.isEmpty()) {
      return Collections.emptyList();
    }
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT e FROM EvaluadorEjeCapacidad e JOIN FETCH e.usuario WHERE e.usuario.id IN :ids ORDER BY e.usuario.id, e.ejeTematico",
              EvaluadorEjeCapacidad.class)
          .setParameter("ids", usuarioIds)
          .getResultList();
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
