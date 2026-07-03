package ar.edu.unlp.jyaa.grupo1.modelo;

/** Roles del diagrama de clases — entrega 2. */
public enum Rol {
  /** Inscripto y aprobado al congreso (asistente al evento). */
  ASISTENTE,
  /** @deprecated Solo para compatibilidad con filas legacy en BD; no asignar en código nuevo. */
  PARTICIPANTE,
  AUTOR,
  EVALUADOR,
  ORGANIZADOR_CIENTIFICO,
  ADMINISTRADOR
}
