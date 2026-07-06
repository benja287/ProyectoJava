package ar.edu.unlp.jyaa.grupo1.config;

import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Ajustes de esquema que Hibernate {@code update} no aplica (p. ej. ampliar ENUM en MySQL).
 */
public final class SchemaMigration {

  private static final Logger log = LoggerFactory.getLogger(SchemaMigration.class);

  private SchemaMigration() {}

  public static void aplicarMigraciones() {
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarColumnaEstadoTrabajo);
  }

  private static void migrarColumnaEstadoTrabajo(EntityManager em) {
    String tipo = leerTipoColumna(em, "trabajos", "estado");
    if (tipo == null) {
      log.warn("No se encontró trabajos.estado; se omite migración de estado");
      return;
    }
    String tipoLower = tipo.toLowerCase();
    if (tipoLower.startsWith("varchar")) {
      log.info("trabajos.estado ya es VARCHAR ({})", tipo);
      return;
    }
    if (tipoLower.startsWith("enum")) {
      if (tipo.contains("PRECHECK_OK") && tipo.contains("EN_EVALUACION")) {
        log.info("trabajos.estado ENUM ya incluye estados del flujo de precheck");
        return;
      }
      log.warn(
          "trabajos.estado es ENUM sin todos los estados Java ({}). Convirtiendo a VARCHAR(50).",
          tipo);
      em.createNativeQuery(
              "ALTER TABLE trabajos MODIFY COLUMN estado VARCHAR(50) NOT NULL")
          .executeUpdate();
      log.info("trabajos.estado migrado a VARCHAR(50)");
      return;
    }
    log.info("trabajos.estado tiene tipo {} — sin cambios automáticos", tipo);
  }

  @SuppressWarnings("unchecked")
  private static String leerTipoColumna(EntityManager em, String tabla, String columna) {
    var filas =
        em.createNativeQuery("SHOW COLUMNS FROM " + tabla + " LIKE :col")
            .setParameter("col", columna)
            .getResultList();
    if (filas.isEmpty()) {
      return null;
    }
    Object fila = filas.get(0);
    if (fila instanceof Object[] cols && cols.length > 1 && cols[1] != null) {
      return cols[1].toString();
    }
    return null;
  }
}
