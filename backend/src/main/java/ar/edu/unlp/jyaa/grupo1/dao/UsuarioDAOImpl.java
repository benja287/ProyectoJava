package ar.edu.unlp.jyaa.grupo1.dao;

import jakarta.enterprise.context.RequestScoped;
import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;

@RequestScoped
public class UsuarioDAOImpl extends AbstractJpaDAO<Usuario> implements UsuarioDAO {

  public UsuarioDAOImpl() {
    super(Usuario.class);
  }

  @Override
  public List<Usuario> listarTodos() {
    EntityManager em = entityManagerParaConsulta();
    try {
      return em.createQuery(
              "SELECT u FROM Usuario u LEFT JOIN FETCH u.roles ORDER BY u.apellido", Usuario.class)
          .getResultList();
    } finally {
      cerrarSiLegacy(em);
    }
  }

  @Override
  public List<Usuario> listarPaginado(int offset, int limit) {
    EntityManager em = entityManagerParaConsulta();
    try {
      return em.createQuery(
              "SELECT u FROM Usuario u LEFT JOIN FETCH u.roles ORDER BY u.apellido", Usuario.class)
          .setFirstResult(offset)
          .setMaxResults(limit)
          .getResultList();
    } finally {
      cerrarSiLegacy(em);
    }
  }

  @Override
  public long contar() {
    EntityManager em = entityManagerParaConsulta();
    try {
      return em.createQuery("SELECT COUNT(u) FROM Usuario u", Long.class).getSingleResult();
    } finally {
      cerrarSiLegacy(em);
    }
  }

  @Override
  public Optional<Usuario> buscarPorEmail(String email) {
    EntityManager em = entityManagerParaConsulta();
    try {
      List<Usuario> list =
          em.createQuery("SELECT u FROM Usuario u WHERE u.email = :email", Usuario.class)
              .setParameter("email", email)
              .getResultList();
      return list.stream().findFirst();
    } finally {
      cerrarSiLegacy(em);
    }
  }

  private EntityManager entityManagerParaConsulta() {
    EntityManager cdi = getEntityManager();
    return cdi != null ? cdi : JpaUtil.createEntityManager();
  }

  private void cerrarSiLegacy(EntityManager em) {
    if (getEntityManager() == null) {
      em.close();
    }
  }
}
