package ar.edu.unlp.jyaa.grupo1.dao.filtro;

import ar.edu.unlp.jyaa.grupo1.modelo.EstadoTrabajo;
import ar.edu.unlp.jyaa.grupo1.modelo.ModalidadPresentacion;
import ar.edu.unlp.jyaa.grupo1.modelo.TipoTrabajo;

/** Filtros opcionales sobre el trabajo de una asignación del evaluador. */
public record AsignacionEvaluadorFiltro(
    TipoTrabajo tipo,
    ModalidadPresentacion modalidad,
    String ejeTematico,
    EstadoTrabajo estado) {

  public static AsignacionEvaluadorFiltro vacio() {
    return new AsignacionEvaluadorFiltro(null, null, null, null);
  }
}
