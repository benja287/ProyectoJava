package ar.edu.unlp.jyaa.grupo1.config;

import ar.edu.unlp.jyaa.grupo1.modelo.PlantillaEmail;
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
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarPlantillasEmail);
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

  private static void migrarPlantillasEmail(EntityManager em) {
    insertarPlantillaSiFalta(
        em,
        "PRECHECK_OK",
        "[PRECHECK OK] Tu trabajo \"{{titulo}}\" pasó la prevalidación",
        """
            Hola {{nombre}},

            Tu trabajo "{{titulo}}" superó el filtro inicial del comité académico y está listo para asignación de evaluadores.

            Ingresá a la plataforma para ver el estado actualizado:
            {{url_plataforma}}

            Comité Académico""");
    insertarPlantillaSiFalta(
        em,
        "PRECHECK_OBSERVADO",
        "[PRECHECK OBSERVADO] Observaciones sobre \"{{titulo}}\"",
        """
            Hola {{nombre}},

            Tu trabajo "{{titulo}}" fue observado en la prevalidación formal.

            Observaciones: {{observaciones}}

            {{instruccion_reenvio}}

            Ingresá a la plataforma para corregir y reenviar:
            {{url_plataforma}}

            Comité Académico""");
    insertarPlantillaSiFalta(
        em,
        "ASIGNACION_EVALUADOR",
        "[EVALUACIÓN] Nuevo trabajo asignado: \"{{titulo}}\"",
        """
            Hola {{nombre}},

            Se te asignó el trabajo "{{titulo}}" (eje temático: {{eje}}).

            Ingresá al panel de evaluador para aceptar o rechazar la asignación:
            {{url_plataforma}}

            Comité Académico""");
    insertarPlantillaSiFalta(
        em,
        "EVALUACION_FAVORABLE",
        "[EVALUACIÓN] Tu trabajo \"{{titulo}}\" recibió evaluaciones favorables",
        """
            Hola {{nombre}},

            Tu trabajo "{{titulo}}" recibió evaluaciones favorables de los evaluadores.
            El comité académico confirmará el resultado final.

            Ingresá a la plataforma:
            {{url_plataforma}}

            Comité Académico""");
    insertarPlantillaSiFalta(
        em,
        "EVALUACION_RECHAZADO_REENVIO",
        "[RECHAZADO] Tu trabajo \"{{titulo}}\" requiere correcciones",
        """
            Hola {{nombre}},

            Tu trabajo "{{titulo}}" fue rechazado en evaluación.

            {{instruccion_reenvio}}

            Ingresá a la plataforma para corregir y reenviar:
            {{url_plataforma}}

            Comité Evaluador""");
    insertarPlantillaSiFalta(
        em,
        "EVALUACION_RECHAZADO_FINAL",
        "[RECHAZADO FINAL] Tu trabajo \"{{titulo}}\"",
        """
            Hola {{nombre}},

            Tu trabajo "{{titulo}}" fue rechazado en evaluación y no admite más reenvíos.

            Ingresá a la plataforma para consultar el estado:
            {{url_plataforma}}

            Comité Evaluador""");
    insertarPlantillaSiFalta(
        em,
        "REENVIO_ORGANIZADOR",
        "[REENVÍO] Trabajo \"{{titulo}}\" pendiente de prevalidación",
        """
            Hola {{nombre}},

            El autor {{nombre_autor}} reenvió el trabajo "{{titulo}}".
            Revisá la prevalidación y, si corresponde, asigná evaluadores.

            Panel del comité:
            {{url_plataforma}}

            Sistema de gestión del congreso""");
    insertarPlantillaSiFalta(
        em,
        "PROMOCION_AUTOR_ADMIN",
        "[ADMIN] Asistente listo para promoción a Autor: {{nombre_asistente}}",
        """
            Hola {{nombre}},

            El asistente {{nombre_asistente}} ({{email_asistente}}) tiene el trabajo aprobado "{{titulo}}".
            Podés habilitarle el rol Autor desde el panel de administración.

            Panel admin:
            {{url_plataforma}}

            Sistema de gestión del congreso""");
    insertarPlantillaSiFalta(
        em,
        "COMITE_APROBADO",
        "[APROBADO] Tu trabajo \"{{titulo}}\" fue aprobado por el comité",
        """
            Hola {{nombre}},

            Tu trabajo "{{titulo}}" fue aprobado definitivamente por el comité académico.

            Ingresá a la plataforma:
            {{url_plataforma}}

            Comité Académico""");
  }

  private static void insertarPlantillaSiFalta(
      EntityManager em, String nombre, String asunto, String cuerpo) {
    Long existentes =
        em.createQuery(
                "SELECT COUNT(p) FROM PlantillaEmail p WHERE p.nombre = :nombre", Long.class)
            .setParameter("nombre", nombre)
            .getSingleResult();
    if (existentes != null && existentes > 0) {
      return;
    }
    PlantillaEmail plantilla = new PlantillaEmail();
    plantilla.setNombre(nombre);
    plantilla.setAsunto(asunto);
    plantilla.setCuerpo(cuerpo);
    em.persist(plantilla);
    log.info("Plantilla de email insertada: {}", nombre);
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
