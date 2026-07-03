package ar.edu.unlp.jyaa.grupo1.modelo;

/** Roles del diagrama de clases — entrega 2. */
public enum Rol {
  /** Inscripto y aprobado al congreso (asistente al evento). */
  ASISTENTE,
  /** @deprecated Usar {@link #ASISTENTE}; se mantiene por datos legacy. */
  PARTICIPANTE,
  AUTOR,
  EVALUADOR,
  ORGANIZADOR_CIENTIFICO,
  ADMINISTRADOR
}
