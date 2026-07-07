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
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarTrabajosObservadosPrecheck);
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarEstadoObservadoEvaluacion);
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarCongresoConfig);
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarCirculares);
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

  /** Trabajos observados en precheck que quedaron ENVIADO por versiones anteriores. */
  private static void migrarTrabajosObservadosPrecheck(EntityManager em) {
    int actualizados =
        em.createNativeQuery(
                "UPDATE trabajos SET estado = 'PRECHECK_OBSERVADO'"
                    + " WHERE estado = 'ENVIADO' AND precheck_intentos > 0 AND precheck_intentos < 3")
            .executeUpdate();
    if (actualizados > 0) {
      log.info("Migrados {} trabajos ENVIADO+precheck → PRECHECK_OBSERVADO", actualizados);
    }
  }

  private static void migrarEstadoObservadoEvaluacion(EntityManager em) {
    int actualizados =
        em.createNativeQuery(
                "UPDATE trabajos SET estado = 'OBSERVADO_EVALUACION'"
                    + " WHERE estado = 'APROBADO_CON_CORRECCIONES'")
            .executeUpdate();
    if (actualizados > 0) {
      log.info("Migrados {} trabajos APROBADO_CON_CORRECCIONES → OBSERVADO_EVALUACION", actualizados);
    }
  }

  /** Columnas de configuración del congreso (programa publicado, certificados, límite envíos). */
  private static void migrarCongresoConfig(EntityManager em) {
    agregarColumnaSiFalta(
        em,
        "congresos",
        "programa_publicado",
        "ALTER TABLE congresos ADD COLUMN programa_publicado TINYINT(1) NOT NULL DEFAULT 0");
    agregarColumnaSiFalta(
        em,
        "congresos",
        "certificados_disponibles_desde",
        "ALTER TABLE congresos ADD COLUMN certificados_disponibles_desde DATE NULL");
    agregarColumnaSiFalta(
        em,
        "congresos",
        "envio_trabajos_hasta",
        "ALTER TABLE congresos ADD COLUMN envio_trabajos_hasta DATE NULL");
  }

  private static void migrarCirculares(EntityManager em) {
    agregarColumnaSiFalta(
        em, "circulares", "resumen", "ALTER TABLE circulares ADD COLUMN resumen TEXT NULL");
    agregarColumnaSiFalta(
        em,
        "circulares",
        "documento_url",
        "ALTER TABLE circulares ADD COLUMN documento_url VARCHAR(500) NULL");
    agregarColumnaSiFalta(
        em,
        "circulares",
        "documento_nombre",
        "ALTER TABLE circulares ADD COLUMN documento_nombre VARCHAR(255) NULL");
  }

  private static void agregarColumnaSiFalta(
      EntityManager em, String tabla, String columna, String ddl) {
    if (leerTipoColumna(em, tabla, columna) != null) {
      log.info("{}.{} ya existe", tabla, columna);
      return;
    }
    em.createNativeQuery(ddl).executeUpdate();
    log.info("Migración aplicada: {}.{}", tabla, columna);
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
