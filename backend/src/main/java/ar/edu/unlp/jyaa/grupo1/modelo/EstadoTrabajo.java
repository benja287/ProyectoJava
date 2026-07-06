package ar.edu.unlp.jyaa.grupo1.modelo;

public enum EstadoTrabajo {
  BORRADOR,
  ENVIADO,
  PRECHECK_OK,
  /** Observado en prevalidación formal; el autor puede corregir y reenviar (hasta 3 intentos). */
  PRECHECK_OBSERVADO,
  EN_EVALUACION,
  PENDIENTE_APROBACION_COMITE,
  APROBADO,
  /** Rechazo de evaluador con posibilidad de corregir y reenviar (hasta 2 revisiones). */
  OBSERVADO_EVALUACION,
  RECHAZADO,
  NOTIFICADO,
  PROGRAMADO
}
