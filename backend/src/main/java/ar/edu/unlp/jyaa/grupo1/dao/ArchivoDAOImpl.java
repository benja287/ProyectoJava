package ar.edu.unlp.jyaa.grupo1.dao;

import ar.edu.unlp.jyaa.grupo1.config.JpaUtil;
import ar.edu.unlp.jyaa.grupo1.modelo.Archivo;
import jakarta.enterprise.context.RequestScoped;
import jakarta.persistence.EntityManager;
import java.util.List;

@RequestScoped
public class ArchivoDAOImpl extends AbstractJpaDAO<Archivo> implements ArchivoDAO {

  private static final String SQL_HUERFANOS =
      """
      SELECT a.id FROM archivos a
      WHERE NOT EXISTS (
        SELECT 1 FROM trabajos t
        WHERE t.documento_url = CONCAT('/api/archivos/', a.id))
      AND NOT EXISTS (
        SELECT 1 FROM trabajos t
        WHERE t.documento_docx_url = CONCAT('/api/archivos/', a.id))
      AND NOT EXISTS (
        SELECT 1 FROM pagos p
        WHERE p.comprobante_url = CONCAT('/api/archivos/', a.id))
      AND NOT EXISTS (
        SELECT 1 FROM pagos p
        WHERE p.factura_url = CONCAT('/api/archivos/', a.id))
      AND NOT EXISTS (
        SELECT 1 FROM inscripciones_congreso i
        WHERE i.certificado_url = CONCAT('/api/archivos/', a.id))
      AND NOT EXISTS (
        SELECT 1 FROM circulares c
        WHERE c.documento_url = CONCAT('/api/archivos/', a.id))
      AND NOT EXISTS (
        SELECT 1 FROM evaluaciones e
        WHERE e.archivo_correccion_url = CONCAT('/api/archivos/', a.id))
      AND NOT EXISTS (
        SELECT 1 FROM congresos c
        WHERE c.qr_pago_url = CONCAT('/api/archivos/', a.id))
      """;

  public ArchivoDAOImpl() {
    super(Archivo.class);
  }

  @Override
  @SuppressWarnings("unchecked")
  public List<Long> listarIdsHuerfanos() {
    EntityManager em = emConsulta();
    try {
      List<Number> filas = em.createNativeQuery(SQL_HUERFANOS).getResultList();
      return filas.stream().map(Number::longValue).toList();
    } finally {
      closeLegacy(em);
    }
  }

  @Override
  public int eliminarPorIds(List<Long> ids) {
    if (ids == null || ids.isEmpty()) {
      return 0;
    }
    EntityManager em = emConsulta();
    boolean legacy = getEntityManager() == null;
    try {
      if (legacy) {
        em.getTransaction().begin();
      }
      int n =
          em.createQuery("DELETE FROM Archivo a WHERE a.id IN :ids")
              .setParameter("ids", ids)
              .executeUpdate();
      if (legacy) {
        em.getTransaction().commit();
      }
      return n;
    } catch (RuntimeException e) {
      if (legacy && em.getTransaction().isActive()) {
        em.getTransaction().rollback();
      }
      throw e;
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
