package ar.edu.unlp.jyaa.grupo1.modelo;

public enum EstadoSolicitudEvaluador {
  PENDIENTE,
  APROBADA,
  RECHAZADA,
  /** Rol EVALUADOR retirado después de una aprobación (puede volver a postularse). */
  REVOCADA
}
