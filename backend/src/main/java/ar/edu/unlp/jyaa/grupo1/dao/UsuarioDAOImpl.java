package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Usuario;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;

public class UsuarioDAOImpl extends AbstractJpaDAO<Usuario> implements UsuarioDAO {

  public UsuarioDAOImpl() {
    super(Usuario.class);
  }

  @Override
  public List<Usuario> listarTodos() {
    EntityManager em = JpaUtil.createEntityManager();
    try {
      return em.createQuery(
              "SELECT u FROM Usuario u LEFT JOIN FETCH u.roles ORDER BY u.apellido", Usuario.class)
          .getResultList();
    } finally {
      em.close();
    }
  }

  @Override
  public Optional<Usuario> buscarPorEmail(String email) {
    EntityManager em = JpaUtil.createEntityManager();
    try {
      List<Usuario> list =
          em.createQuery("SELECT u FROM Usuario u WHERE u.email = :email", Usuario.class)
              .setParameter("email", email)
              .getResultList();
      return list.stream().findFirst();
    } finally {
      em.close();
    }
  }
}
