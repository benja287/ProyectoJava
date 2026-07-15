package ar.edu.unlp.jyaa.grupo1.servicio;

import ar.edu.unlp.jyaa.grupo1.modelo.Rol;
import ar.edu.unlp.jyaa.grupo1.modelo.Trabajo;

/**
 * Textos y rutas de notificaciones de trabajos (espejo de trabajo-rol.util.ts en el frontend).
 * Estructura: qué pasó + próximo paso + enlace a la pantalla correcta.
 */
final class TrabajoNotificacionHelper {

  static final String RUTA_ASISTENTE_TRABAJOS = "/asistente/trabajos";
  static final String RUTA_AUTOR_TRABAJOS = "/autor/trabajos";
  static final String RUTA_COMITE = "/organizador/comite";
  static final String RUTA_EVALUADOR = "/evaluador";
  static final String RUTA_ADMIN_SOLICITUDES_AUTOR = "/admin/solicitudes-autor";
  static final String RUTA_ASISTENTE = "/asistente";
  static final String RUTA_AUTOR = "/autor";

  private TrabajoNotificacionHelper() {}

  static boolean esEnvioAsistente(Trabajo trabajo) {
    return trabajo.getRolEnvio() == null || trabajo.getRolEnvio() == Rol.ASISTENTE;
  }

  static String etiquetaRol(Trabajo trabajo) {
    return esEnvioAsistente(trabajo) ? "asistente" : "autor";
  }

  /** Ruta del panel donde el autor/asistente gestiona el trabajo. */
  static String rutaPanelParticipante(Trabajo trabajo) {
    return esEnvioAsistente(trabajo) ? RUTA_ASISTENTE_TRABAJOS : RUTA_AUTOR_TRABAJOS;
  }

  static String mensajeEnvio(Trabajo trabajo, boolean reenvio) {
    String rol = etiquetaRol(trabajo);
    String titulo = titulo(trabajo);
    String estado = trabajo.getEstado() != null ? trabajo.getEstado().name() : "ENVIADO";
    String quePaso =
        reenvio
            ? "Reenviaste el trabajo \""
                + titulo
                + "\" como "
                + rol
                + ". Estado: "
                + estado
                + " (pendiente de prevalidación formal del comité)."
            : "Enviaste el trabajo \""
                + titulo
                + "\" como "
                + rol
                + ". Estado: "
                + estado
                + " (pendiente de prevalidación formal del comité).";
    String proximo =
        "No tenés que hacer nada hasta el precheck. Si lo observan, corregís y reenviás desde tu panel.";
    return formatear(quePaso, proximo);
  }

  static String mensajePrecheckRechazadoFinal(Trabajo trabajo, int intentos) {
    return formatear(
        "Tu trabajo \""
            + titulo(trabajo)
            + "\" no superó el precheck tras "
            + intentos
            + "/3 intentos (envío como "
            + etiquetaRol(trabajo)
            + "). Estado: RECHAZADO.",
        "No hay más reenvíos de prevalidación. Consultá el detalle en tu panel.");
  }

  static String mensajeRechazoComite(Trabajo trabajo, String motivo) {
    return formatear(
        "Tu trabajo \""
            + titulo(trabajo)
            + "\" fue rechazado definitivamente por el comité (envío como "
            + etiquetaRol(trabajo)
            + "). Motivo: "
            + motivo,
        "Podés consultar el estado en tu panel de trabajos.");
  }

  static String mensajeTaller(Trabajo trabajo, boolean aprobar, String comentario) {
    String base =
        aprobar
            ? "Tu propuesta de taller \"" + titulo(trabajo) + "\" fue aprobada. Estado: APROBADO."
            : "Tu propuesta de taller \""
                + titulo(trabajo)
                + "\" no fue aprobada. Estado: RECHAZADO.";
    if (comentario != null && !comentario.isBlank()) {
      base += " Comentario: " + comentario.trim();
    }
    String proximo =
        aprobar
            ? "El administrador podrá programarla en el cronograma. Revisá tu panel."
            : "Consultá el detalle en tu panel de propuestas.";
    return formatear(base, proximo);
  }

  static String instruccionReenvio(Trabajo trabajo) {
    if (esEnvioAsistente(trabajo)) {
      return "Próximo paso: corregí y reenviá desde el panel asistente ("
          + RUTA_ASISTENTE_TRABAJOS
          + "). Si el comité aprueba el trabajo, el rol Autor se habilita automáticamente.";
    }
    return "Próximo paso: corregí y reenviá desde Mis trabajos (" + RUTA_AUTOR_TRABAJOS + ").";
  }

  static String contextoParticipante(Trabajo trabajo) {
    int precheck = Math.min(trabajo.getPrecheckIntentos(), 3);
    int revision = Math.min(trabajo.getRevisionIntentos(), 2);
    return "Envío como "
        + etiquetaRol(trabajo)
        + ". Estado: "
        + (trabajo.getEstado() != null ? trabajo.getEstado().name() : "—")
        + ". Precheck "
        + precheck
        + "/3. Revisión "
        + revision
        + "/2.";
  }

  static String formatear(String quePaso, String proximoPaso) {
    return "Qué pasó: " + quePaso + "\n\nPróximo paso: " + proximoPaso;
  }

  private static String titulo(Trabajo trabajo) {
    return trabajo.getTitulo() != null ? trabajo.getTitulo() : "";
  }
}
