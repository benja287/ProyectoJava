package ar.edu.unlp.jyaa.grupo1.dao.filtro;

import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;

/** Filtros opcionales para listado de trabajos. */
public record TrabajoFiltro(
    String titulo,
    String resumen,
    String ejeTematico,
    EstadoTrabajo estado,
    String modalidad,
    String tipo,
    Long autorId,
    Long excluirAutorId) {

  /** Compatibilidad: sin recusación por autor. */
  public TrabajoFiltro(
      String titulo,
      String resumen,
      String ejeTematico,
      EstadoTrabajo estado,
      String modalidad,
      String tipo,
      Long autorId) {
    this(titulo, resumen, ejeTematico, estado, modalidad, tipo, autorId, null);
  }
}
