package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.ArancelCategoria;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;

@RequestScoped
public class ArancelCategoriaDAOImpl extends AbstractJpaDAO<ArancelCategoria>
    implements ArancelCategoriaDAO {

  public ArancelCategoriaDAOImpl() {
    super(ArancelCategoria.class);
  }

  @Override
  public List<ArancelCategoria> listarTodos() {
    EntityManager em = emConsulta();
    try {
      return em.createQuery(
              "SELECT a FROM ArancelCategoria a ORDER BY a.categoria", ArancelCategoria.class)
          .getResultList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public Optional<ArancelCategoria> buscarPorCategoria(String categoria) {
    if (categoria == null || categoria.isBlank()) {
      return Optional.empty();
    }
    EntityManager em = emConsulta();
    try {
      List<ArancelCategoria> filas =
          em.createQuery(
                  "SELECT a FROM ArancelCategoria a WHERE a.categoria = :cat",
                  ArancelCategoria.class)
              .setParameter("cat", categoria.trim().toUpperCase())
              .setMaxResults(1)
              .getResultList();
      return filas.stream().findFirst();
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
