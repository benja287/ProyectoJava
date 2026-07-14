package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Certificado;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;

@RequestScoped
public class CertificadoDAOImpl extends AbstractJpaDAO<Certificado> implements CertificadoDAO {

  public CertificadoDAOImpl() {
    super(Certificado.class);
  }

  @Override
  public List<Certificado> listarTodos() {
    if (getEntityManager() != null) {
      return getEntityManager()
          .createQuery(
              "SELECT c FROM Certificado c JOIN FETCH c.usuario", Certificado.class)
          .getResultList();
    }
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.createQuery(
              "SELECT c FROM Certificado c JOIN FETCH c.usuario", Certificado.class)
          .getResultList();
    } finally {
      em.close();
    }
  }

  @Override
  public Optional<Certificado> buscarPorUsuarioId(Long usuarioId) {
    if (usuarioId == null) {
      return Optional.empty();
    }
    EntityManager em = getEntityManager() != null ? getEntityManager() : JpaUtil.createEntityManager();
    boolean close = getEntityManager() == null;
    try {
      return em
          .createQuery(
              "SELECT c FROM Certificado c WHERE c.usuario.id = :uid", Certificado.class)
          .setParameter("uid", usuarioId)
          .setMaxResults(1)
          .getResultStream()
          .findFirst();
    } finally {
      if (close) {
        em.close();
      }
    }
  }

  @Override
  public boolean existePorUsuarioId(Long usuarioId) {
    return buscarPorUsuarioId(usuarioId).isPresent();
  }
}
