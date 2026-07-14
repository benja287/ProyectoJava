package ar.edu.unlp.jyaa.grupo1.config;

import ar.edu.unlp.jyaa.grupo1.modelo.CongresoAnterior;
import ar.edu.unlp.jyaa.grupo1.modelo.PlantillaEmail;
import jakarta.persistence.EntityManager;
import java.util.List;
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
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarCongresosAnteriores);
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarAulasYPrograma);
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarNotificacionEnlace);
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarPlantillasTrabajoEnriquecidas);
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarEvaluacionDictamen);
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarAulaCoordenadas);
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarCongresoMapaUbicacion);
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarFranjasHorarias);
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarCongresoJornadaYLimpiarSeedFranjas);
    JpaUtil.ejecutarEnTransaccion(SchemaMigration::migrarVaciarFranjasArranqueLibre);
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

  /** Columnas de configuración del congreso (programa, certificados, ventanas de fechas). */
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
    agregarColumnaSiFalta(
        em,
        "congresos",
        "congreso_desde",
        "ALTER TABLE congresos ADD COLUMN congreso_desde DATE NULL");
    agregarColumnaSiFalta(
        em,
        "congresos",
        "congreso_hasta",
        "ALTER TABLE congresos ADD COLUMN congreso_hasta DATE NULL");
    agregarColumnaSiFalta(
        em,
        "congresos",
        "inscripciones_desde",
        "ALTER TABLE congresos ADD COLUMN inscripciones_desde DATE NULL");
    agregarColumnaSiFalta(
        em,
        "congresos",
        "inscripciones_hasta",
        "ALTER TABLE congresos ADD COLUMN inscripciones_hasta DATE NULL");
    agregarColumnaSiFalta(
        em,
        "congresos",
        "evaluacion_hasta",
        "ALTER TABLE congresos ADD COLUMN evaluacion_hasta DATE NULL");
    agregarColumnaSiFalta(
        em,
        "congresos",
        "sede",
        "ALTER TABLE congresos ADD COLUMN sede VARCHAR(200) NULL");
    em.createNativeQuery(
            "UPDATE congresos SET sede = 'La Plata' WHERE sede IS NULL OR TRIM(sede) = ''")
        .executeUpdate();
  }

  /**
   * Aulas del congreso + día lógico / FK en actividades (programa adaptable al postergar).
   */
  private static void migrarAulasYPrograma(EntityManager em) {
    crearTablaAulasSiFalta(em);
    agregarColumnaSiFalta(
        em,
        "actividades",
        "dia_congreso",
        "ALTER TABLE actividades ADD COLUMN dia_congreso INT NULL");
    agregarColumnaSiFalta(
        em,
        "actividades",
        "aula_id",
        "ALTER TABLE actividades ADD COLUMN aula_id BIGINT NULL");
    backfillDiaCongreso(em);
  }

  private static void crearTablaAulasSiFalta(EntityManager em) {
    if (tablaExiste(em, "aulas")) {
      log.info("Tabla aulas ya existe");
      return;
    }
    em.createNativeQuery(
            "CREATE TABLE aulas ("
                + "id BIGINT NOT NULL AUTO_INCREMENT,"
                + "nombre VARCHAR(120) NOT NULL,"
                + "capacidad INT NULL,"
                + "ubicacion VARCHAR(300) NULL,"
                + "activa TINYINT(1) NOT NULL DEFAULT 1,"
                + "PRIMARY KEY (id)"
                + ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4")
        .executeUpdate();
    log.info("Tabla aulas creada");
  }

  /** Rellena dia_congreso a partir de inicio vs congreso_desde cuando falta. */
  private static void backfillDiaCongreso(EntityManager em) {
    int actualizados =
        em.createNativeQuery(
                "UPDATE actividades a"
                    + " INNER JOIN (SELECT congreso_desde FROM congresos ORDER BY id DESC LIMIT 1) c"
                    + " SET a.dia_congreso = DATEDIFF(DATE(a.inicio), c.congreso_desde) + 1"
                    + " WHERE a.dia_congreso IS NULL"
                    + " AND a.inicio IS NOT NULL"
                    + " AND c.congreso_desde IS NOT NULL"
                    + " AND DATEDIFF(DATE(a.inicio), c.congreso_desde) BETWEEN 0 AND 2")
            .executeUpdate();
    if (actualizados > 0) {
      log.info("Backfill dia_congreso en {} actividades", actualizados);
    }
  }

  @SuppressWarnings("unchecked")
  private static boolean tablaExiste(EntityManager em, String tabla) {
    var filas =
        em.createNativeQuery("SHOW TABLES LIKE :t").setParameter("t", tabla).getResultList();
    return !filas.isEmpty();
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
        "ENVIO_TRABAJO_ORGANIZADOR",
        "[ENVÍO] Nuevo trabajo \"{{titulo}}\" pendiente de prevalidación",
        """
            Hola {{nombre}},

            El participante {{nombre_autor}} envió el trabajo "{{titulo}}".
            Revisá la prevalidación y, si corresponde, asigná evaluadores.

            Panel del comité:
            {{url_plataforma}}

            Sistema de gestión del congreso""");
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
    insertarPlantillaSiFalta(
        em,
        "INSCRIPCION_PENDIENTE_ADMIN",
        "[INSCRIPCIÓN] Nueva solicitud de {{nombre_solicitante}}",
        """
            Hola {{nombre}},

            {{nombre_solicitante}} ({{email_solicitante}}) solicitó inscripción al congreso.

            Categoría: {{categoria}}
            Monto: ${{monto}}
            Forma de pago: {{metodo_pago}}

            Revisá y aprobá el pago desde el panel de administración:
            {{url_plataforma}}/admin/inscripciones

            Sistema de gestión del congreso""");
    insertarPlantillaSiFalta(
        em,
        "INSCRIPCION_RECIBIDA_USUARIO",
        "[INSCRIPCIÓN] Recibimos tu solicitud al congreso",
        """
            Hola {{nombre}},

            Recibimos tu inscripción al congreso. Está pendiente de validación por la organización.

            Categoría: {{categoria}}
            Monto: ${{monto}}
            Forma de pago: {{metodo_pago}}

            Te avisaremos cuando se apruebe o si necesitamos algún dato más.
            Podés consultar el estado en:
            {{url_plataforma}}/inscripcion

            Sistema de gestión del congreso""");
    insertarPlantillaSiFalta(
        em,
        "INSCRIPCION_APROBADA_USUARIO",
        "[INSCRIPCIÓN] Fuiste aceptado/a como asistente",
        """
            Hola {{nombre}},

            Tu inscripción al congreso fue aprobada. Ya tenés el rol de asistente habilitado.

            Ingresá a tu panel de asistente:
            {{url_plataforma}}/asistente

            ¡Te esperamos en el congreso!

            Sistema de gestión del congreso""");
    insertarPlantillaSiFalta(
        em,
        "INSCRIPCION_RECHAZADA_USUARIO",
        "[INSCRIPCIÓN] Tu solicitud no fue aprobada",
        """
            Hola {{nombre}},

            Tu inscripción al congreso no fue aprobada.

            Motivo: {{motivo}}

            Podés revisar el detalle o enviar una nueva solicitud desde:
            {{url_plataforma}}/inscripcion

            Sistema de gestión del congreso""");
    insertarPlantillaSiFalta(
        em,
        "CIRCULAR_PUBLICADA",
        "[CIRCULAR] Nueva publicación: \"{{titulo}}\"",
        """
            Hola {{nombre}},

            Se publicó una nueva circular del congreso: "{{titulo}}".

            {{resumen}}

            Próximo paso: {{proximo_paso}}

            Ver circulares:
            {{url_accion}}

            Sistema de gestión del congreso""");
    insertarPlantillaSiFalta(
        em,
        "CERTIFICADOS_DISPONIBLES",
        "[CERTIFICADOS] Ya podés descargar tu certificado",
        """
            Hola {{nombre}},

            El congreso finalizó y ya podés generar/descargar tu certificado de participación.

            Ingresá a la plataforma e imprimí o guardá el PDF desde:
            {{url_accion}}

            Sistema de gestión del congreso""");
    insertarPlantillaSiFalta(
        em,
        "PRECONGRESO_ORGANIZACION",
        "[PRE-CONGRESO] Checklist de organización — {{estado}}",
        """
            Hola {{nombre}},

            Estado del checklist pre-congreso: {{estado}}

            {{resumen}}

            Próximo paso: {{proximo_paso}}

            Ver estadísticas:
            {{url_accion}}

            Sistema de gestión del congreso""");
    insertarPlantillaSiFalta(
        em,
        "RECORDATORIO_PENDIENTE",
        "[RECORDATORIO] Tenés tareas pendientes en el congreso",
        """
            Hola {{nombre}},

            {{tarea}}

            Próximo paso: {{proximo_paso}}

            Ingresá a la plataforma:
            {{url_accion}}

            Sistema de gestión del congreso""");
  }

  /** Columna enlace para botón "Ir a…" en la campana de notificaciones. */
  private static void migrarNotificacionEnlace(EntityManager em) {
    agregarColumnaSiFalta(
        em,
        "notificaciones",
        "enlace",
        "ALTER TABLE notificaciones ADD COLUMN enlace VARCHAR(300) NULL");
  }

  /** Campos del dictamen completo del evaluador (rúbrica PDF). */
  private static void migrarEvaluacionDictamen(EntityManager em) {
    agregarColumnaSiFalta(
        em,
        "evaluaciones",
        "comentario_comite",
        "ALTER TABLE evaluaciones ADD COLUMN comentario_comite TEXT NULL");
    agregarColumnaSiFalta(
        em,
        "evaluaciones",
        "modalidad_recomendada",
        "ALTER TABLE evaluaciones ADD COLUMN modalidad_recomendada VARCHAR(30) NULL");
    agregarColumnaSiFalta(
        em,
        "evaluaciones",
        "rubrica_json",
        "ALTER TABLE evaluaciones ADD COLUMN rubrica_json TEXT NULL");
    agregarColumnaSiFalta(
        em,
        "evaluaciones",
        "archivo_correccion_url",
        "ALTER TABLE evaluaciones ADD COLUMN archivo_correccion_url VARCHAR(500) NULL");
    agregarColumnaSiFalta(
        em,
        "evaluaciones",
        "archivo_correccion_nombre",
        "ALTER TABLE evaluaciones ADD COLUMN archivo_correccion_nombre VARCHAR(255) NULL");
  }

  /** Coordenadas opcionales de aulas (mapa acotado del campus). APPEND — no pisar migraciones previas. */
  private static void migrarAulaCoordenadas(EntityManager em) {
    agregarColumnaSiFalta(
        em, "aulas", "latitud", "ALTER TABLE aulas ADD COLUMN latitud DOUBLE NULL");
    agregarColumnaSiFalta(
        em, "aulas", "longitud", "ALTER TABLE aulas ADD COLUMN longitud DOUBLE NULL");
  }

  /**
   * Centro geográfico de la sede del congreso (rango de aulas derivado en runtime). APPEND —
   * no pisar migraciones previas. Semilla FCAyF si hay sede sin coords.
   */
  private static void migrarCongresoMapaUbicacion(EntityManager em) {
    agregarColumnaSiFalta(
        em,
        "congresos",
        "mapa_latitud",
        "ALTER TABLE congresos ADD COLUMN mapa_latitud DOUBLE NULL");
    agregarColumnaSiFalta(
        em,
        "congresos",
        "mapa_longitud",
        "ALTER TABLE congresos ADD COLUMN mapa_longitud DOUBLE NULL");
    em.createNativeQuery(
            "UPDATE congresos SET mapa_latitud = -34.9112, mapa_longitud = -57.9420 "
                + "WHERE mapa_latitud IS NULL OR mapa_longitud IS NULL")
        .executeUpdate();
  }

  /**
   * Actualiza cuerpos de plantillas de trabajos con qué pasó / próximo paso / deep link.
   * Idempotente: solo reescribe si aún no incluyen {@code {{url_accion}}}.
   */
  private static void migrarPlantillasTrabajoEnriquecidas(EntityManager em) {
    actualizarPlantillaSiSinUrlAccion(
        em,
        "PRECHECK_OK",
        "[PRECHECK OK] Tu trabajo \"{{titulo}}\" pasó la prevalidación",
        """
            Hola {{nombre}},

            Qué pasó: tu trabajo "{{titulo}}" superó la prevalidación formal del comité.
            {{contexto}}

            Próximo paso: {{proximo_paso}}

            Abrí tu panel de trabajos:
            {{url_accion}}

            Comité Académico""");
    actualizarPlantillaSiSinUrlAccion(
        em,
        "PRECHECK_OBSERVADO",
        "[PRECHECK OBSERVADO] Observaciones sobre \"{{titulo}}\"",
        """
            Hola {{nombre}},

            Qué pasó: tu trabajo "{{titulo}}" fue observado en la prevalidación formal.
            {{contexto}}

            Observaciones: {{observaciones}}

            {{instruccion_reenvio}}

            Abrí la pantalla para corregir y reenviar:
            {{url_accion}}

            Comité Académico""");
    actualizarPlantillaSiSinUrlAccion(
        em,
        "ASIGNACION_EVALUADOR",
        "[EVALUACIÓN] Nuevo trabajo asignado: \"{{titulo}}\"",
        """
            Hola {{nombre}},

            Qué pasó: se te asignó el trabajo "{{titulo}}" (eje: {{eje}}).
            {{contexto}}

            Próximo paso: {{proximo_paso}}

            Panel de evaluador:
            {{url_accion}}

            Comité Académico""");
    actualizarPlantillaSiSinUrlAccion(
        em,
        "EVALUACION_FAVORABLE",
        "[EVALUACIÓN] Tu trabajo \"{{titulo}}\" recibió evaluaciones favorables",
        """
            Hola {{nombre}},

            Qué pasó: tu trabajo "{{titulo}}" recibió evaluaciones favorables.
            {{contexto}}

            Próximo paso: {{proximo_paso}}

            Consultá el estado:
            {{url_accion}}

            Comité Académico""");
    actualizarPlantillaSiSinUrlAccion(
        em,
        "EVALUACION_RECHAZADO_REENVIO",
        "[RECHAZADO] Tu trabajo \"{{titulo}}\" requiere correcciones",
        """
            Hola {{nombre}},

            Qué pasó: tu trabajo "{{titulo}}" fue rechazado en evaluación y admite reenvío.
            {{contexto}}

            {{instruccion_reenvio}}

            Corregí y reenviá desde:
            {{url_accion}}

            Comité Evaluador""");
    actualizarPlantillaSiSinUrlAccion(
        em,
        "EVALUACION_RECHAZADO_FINAL",
        "[RECHAZADO FINAL] Tu trabajo \"{{titulo}}\"",
        """
            Hola {{nombre}},

            Qué pasó: tu trabajo "{{titulo}}" fue rechazado en evaluación y no admite más reenvíos.
            {{contexto}}

            Próximo paso: {{proximo_paso}}

            Consultá el detalle:
            {{url_accion}}

            Comité Evaluador""");
    actualizarPlantillaSiSinUrlAccion(
        em,
        "ENVIO_TRABAJO_ORGANIZADOR",
        "[ENVÍO] Nuevo trabajo \"{{titulo}}\" pendiente de prevalidación",
        """
            Hola {{nombre}},

            Qué pasó: {{nombre_autor}} envió el trabajo "{{titulo}}".
            {{contexto}}

            Próximo paso: {{proximo_paso}}

            Panel del comité:
            {{url_accion}}

            Sistema de gestión del congreso""");
    actualizarPlantillaSiSinUrlAccion(
        em,
        "REENVIO_ORGANIZADOR",
        "[REENVÍO] Trabajo \"{{titulo}}\" pendiente de prevalidación",
        """
            Hola {{nombre}},

            Qué pasó: {{nombre_autor}} reenvió el trabajo "{{titulo}}".
            {{contexto}}

            Próximo paso: {{proximo_paso}}

            Panel del comité:
            {{url_accion}}

            Sistema de gestión del congreso""");
    actualizarPlantillaSiSinUrlAccion(
        em,
        "PROMOCION_AUTOR_ADMIN",
        "[ADMIN] Asistente listo para promoción a Autor: {{nombre_asistente}}",
        """
            Hola {{nombre}},

            Qué pasó: el asistente {{nombre_asistente}} ({{email_asistente}}) tiene el trabajo aprobado "{{titulo}}".

            Próximo paso: {{proximo_paso}}

            Panel admin:
            {{url_accion}}

            Sistema de gestión del congreso""");
    actualizarPlantillaSiSinUrlAccion(
        em,
        "COMITE_APROBADO",
        "[APROBADO] Tu trabajo \"{{titulo}}\" fue aprobado por el comité",
        """
            Hola {{nombre}},

            Qué pasó: tu trabajo "{{titulo}}" fue aprobado definitivamente por el comité académico.
            {{contexto}}

            Próximo paso: {{proximo_paso}}

            Consultá tu panel:
            {{url_accion}}

            Comité Académico""");
  }

  private static void actualizarPlantillaSiSinUrlAccion(
      EntityManager em, String nombre, String asunto, String cuerpo) {
    List<PlantillaEmail> list =
        em.createQuery(
                "SELECT p FROM PlantillaEmail p WHERE p.nombre = :nombre", PlantillaEmail.class)
            .setParameter("nombre", nombre)
            .getResultList();
    if (list.isEmpty()) {
      insertarPlantillaSiFalta(em, nombre, asunto, cuerpo);
      return;
    }
    PlantillaEmail p = list.get(0);
    String actual = p.getCuerpo() != null ? p.getCuerpo() : "";
    if (actual.contains("{{url_accion}}")) {
      return;
    }
    p.setAsunto(asunto);
    p.setCuerpo(cuerpo);
    em.merge(p);
    log.info("Plantilla de email actualizada (deep link): {}", nombre);
  }

  /** Seed de ediciones anteriores (historia pública) — idempotente por año. */
  private static void migrarCongresosAnteriores(EntityManager em) {
    insertarCongresoAnteriorSiFalta(
        em,
        1,
        2019,
        "I Congreso Argentino de Agroecología",
        "Mendoza (UNCuyo)",
        "18–20 sep 2019",
        "Primera edición: consolidó el espacio federal de intercambio entre ciencia, producción y territorios.",
        "https://fca.uncuyo.edu.ar/1-congreso-argentino-de-agroecologia-concurrencia-masiva",
        "https://fca.uncuyo.edu.ar/ya-se-encuentra-disponible-el-libro-de-resumenes-del-primer-congreso-argentino-de-agroecologia");
    insertarCongresoAnteriorSiFalta(
        em,
        2,
        2021,
        "II Congreso Argentino de Agroecología",
        "Resistencia (Chaco) — virtual",
        "13–15 oct 2021",
        "Edición virtual que amplió la participación federal bajo el lema “Entrelazando saberes hacia el Buen Vivir”.",
        "https://agroecologiasaae2021.uncaus.edu.ar/",
        "https://rid.unam.edu.ar/handle/20.500.12219/3883");
    insertarCongresoAnteriorSiFalta(
        em,
        3,
        2023,
        "III Congreso Argentino de Agroecología",
        "El Bolsón (Río Negro)",
        "29 nov – 1 dic 2023",
        "Edición organizada junto a UNRN. Se publicaron actas/memorias y resúmenes extendidos por eje temático.",
        "https://congresoagroecologia2023.unrn.edu.ar/",
        "https://publicaciones.unrn.edu.ar/index.php/CyJ/issue/view/agro-cong-III");
    insertarCongresoAnteriorSiFalta(
        em,
        4,
        2025,
        "IV Congreso Argentino de Agroecología",
        "San Salvador de Jujuy",
        "12–14 nov 2025",
        "Edición previa al congreso 2027. Sitio del evento con información de organización, programa y comunicación.",
        "https://ivcaaejujuy.unju.edu.ar/",
        null);
  }

  private static void insertarCongresoAnteriorSiFalta(
      EntityManager em,
      int orden,
      int anio,
      String titulo,
      String ubicacion,
      String fechaEtiqueta,
      String destacado,
      String urlSitio,
      String urlMemorias) {
    Long existentes =
        em.createQuery(
                "SELECT COUNT(c) FROM CongresoAnterior c WHERE c.anio = :anio", Long.class)
            .setParameter("anio", anio)
            .getSingleResult();
    if (existentes != null && existentes > 0) {
      return;
    }
    CongresoAnterior c = new CongresoAnterior();
    c.setOrden(orden);
    c.setAnio(anio);
    c.setTitulo(titulo);
    c.setUbicacion(ubicacion);
    c.setFechaEtiqueta(fechaEtiqueta);
    c.setDestacado(destacado);
    c.setUrlSitio(urlSitio);
    c.setUrlMemorias(urlMemorias);
    em.persist(c);
    log.info("Congreso anterior insertado: {} ({})", titulo, anio);
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

  /** APPEND — franjas horarias configurables por día lógico (1..3). */
  private static void migrarFranjasHorarias(EntityManager em) {
    if (!tablaExiste(em, "franjas_horarias")) {
      em.createNativeQuery(
              "CREATE TABLE franjas_horarias ("
                  + "id BIGINT NOT NULL AUTO_INCREMENT,"
                  + "dia_congreso INT NOT NULL,"
                  + "etiqueta VARCHAR(120) NULL,"
                  + "hora_inicio TIME NOT NULL,"
                  + "hora_fin TIME NOT NULL,"
                  + "activa TINYINT(1) NOT NULL DEFAULT 1,"
                  + "PRIMARY KEY (id)"
                  + ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4")
          .executeUpdate();
      log.info("Tabla franjas_horarias creada");
    } else {
      log.info("Tabla franjas_horarias ya existe");
    }
    // Sin seed: el admin/comité crea franjas sobre la jornada configurada.
  }

  /**
   * APPEND — jornada de actividades (global + override por día) y limpieza del seed de franjas.
   * Solo borra franjas la primera vez que se agregan las columnas de jornada.
   */
  private static void migrarCongresoJornadaYLimpiarSeedFranjas(EntityManager em) {
    boolean primeraVez = leerTipoColumna(em, "congresos", "jornada_inicio") == null;
    agregarColumnaSiFalta(
        em, "congresos", "jornada_inicio", "ALTER TABLE congresos ADD COLUMN jornada_inicio TIME NULL");
    agregarColumnaSiFalta(
        em, "congresos", "jornada_fin", "ALTER TABLE congresos ADD COLUMN jornada_fin TIME NULL");
    agregarColumnaSiFalta(
        em,
        "congresos",
        "jornada_inicio_dia1",
        "ALTER TABLE congresos ADD COLUMN jornada_inicio_dia1 TIME NULL");
    agregarColumnaSiFalta(
        em,
        "congresos",
        "jornada_fin_dia1",
        "ALTER TABLE congresos ADD COLUMN jornada_fin_dia1 TIME NULL");
    agregarColumnaSiFalta(
        em,
        "congresos",
        "jornada_inicio_dia2",
        "ALTER TABLE congresos ADD COLUMN jornada_inicio_dia2 TIME NULL");
    agregarColumnaSiFalta(
        em,
        "congresos",
        "jornada_fin_dia2",
        "ALTER TABLE congresos ADD COLUMN jornada_fin_dia2 TIME NULL");
    agregarColumnaSiFalta(
        em,
        "congresos",
        "jornada_inicio_dia3",
        "ALTER TABLE congresos ADD COLUMN jornada_inicio_dia3 TIME NULL");
    agregarColumnaSiFalta(
        em,
        "congresos",
        "jornada_fin_dia3",
        "ALTER TABLE congresos ADD COLUMN jornada_fin_dia3 TIME NULL");

    int defaults =
        em.createNativeQuery(
                "UPDATE congresos SET jornada_inicio = '09:00:00'"
                    + " WHERE jornada_inicio IS NULL")
            .executeUpdate();
    em.createNativeQuery(
            "UPDATE congresos SET jornada_fin = '20:00:00' WHERE jornada_fin IS NULL")
        .executeUpdate();
    if (defaults > 0) {
      log.info("Jornada global por defecto 09:00–20:00 aplicada a {} congreso(s)", defaults);
    }

    if (primeraVez && tablaExiste(em, "franjas_horarias")) {
      int borradas = em.createNativeQuery("DELETE FROM franjas_horarias").executeUpdate();
      log.info(
          "Eliminadas {} franjas (seed/demo) al introducir jornada configurable sin valores por defecto",
          borradas);
    }
  }

  /**
   * APPEND — asegurar timeline en verde (sin franjas precargadas).
   * Marker propio: Hibernate a veces crea columnas de jornada antes y el delete anterior no corre.
   */
  private static void migrarVaciarFranjasArranqueLibre(EntityManager em) {
    boolean pendiente = leerTipoColumna(em, "congresos", "franjas_arranque_libre") == null;
    agregarColumnaSiFalta(
        em,
        "congresos",
        "franjas_arranque_libre",
        "ALTER TABLE congresos ADD COLUMN franjas_arranque_libre TINYINT(1) NOT NULL DEFAULT 0");
    if (!pendiente || !tablaExiste(em, "franjas_horarias")) {
      return;
    }
    int borradas = em.createNativeQuery("DELETE FROM franjas_horarias").executeUpdate();
    em.createNativeQuery("UPDATE congresos SET franjas_arranque_libre = 1").executeUpdate();
    log.info(
        "Arranque libre: eliminadas {} franjas precargadas; el timeline queda todo disponible",
        borradas);
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
