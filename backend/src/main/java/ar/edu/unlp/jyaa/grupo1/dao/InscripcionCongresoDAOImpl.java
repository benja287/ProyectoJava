package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;
import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.InscripcionCongreso;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;

@RequestScoped
public class InscripcionCongresoDAOImpl extends AbstractJpaDAO<InscripcionCongreso>
    implements InscripcionCongresoDAO {

  public InscripcionCongresoDAOImpl() {
    super(InscripcionCongreso.class);
  }

  @Override
  public List<InscripcionCongreso> listarTodos() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT i FROM InscripcionCongreso i JOIN FETCH i.usuario LEFT JOIN FETCH i.pago",
              InscripcionCongreso.class)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public List<InscripcionCongreso> listarPorUsuario(Long usuarioId) {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT i FROM InscripcionCongreso i LEFT JOIN FETCH i.pago WHERE i.usuario.id = :id",
              InscripcionCongreso.class)
          .setParameter("id", usuarioId)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public Optional<InscripcionCongreso> buscarUltimaPorUsuario(Long usuarioId) {
    EntityManager em = emConsulta();
    try {
      List<InscripcionCongreso> list =
          em.createQuery(
                  "SELECT i FROM InscripcionCongreso i LEFT JOIN FETCH i.pago WHERE i.usuario.id = :id"
                      + " ORDER BY i.id DESC",
                  InscripcionCongreso.class)
              .setParameter("id", usuarioId)
              .setMaxResults(1)
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
