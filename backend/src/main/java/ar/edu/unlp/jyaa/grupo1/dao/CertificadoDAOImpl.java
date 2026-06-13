package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Certificado;
import jakarta.persistence.EntityManager;
import java.util.List;

@RequestScoped
public class CertificadoDAOImpl extends AbstractJpaDAO<Certificado> implements CertificadoDAO {

  public CertificadoDAOImpl() {
    super(Certificado.class);
  }

  @Override
  public List<Certificado> listarTodos() {
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.createQuery(
              "SELECT c FROM Certificado c JOIN FETCH c.usuario", Certificado.class)
          .getResultList();
    } finally {
      em.close();
    }
  }
}
