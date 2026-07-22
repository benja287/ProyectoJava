package ar.edu.unlp.jyaa.grupo1.dao.filtro;

import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;

/** Filtros opcionales sobre el trabajo de una asignación del evaluador. */
public record AsignacionEvaluadorFiltro(
    String tipo, String modalidad, String ejeTematico, EstadoTrabajo estado) {

  public static AsignacionEvaluadorFiltro vacio() {
    return new AsignacionEvaluadorFiltro(null, null, null, null);
  }
}
