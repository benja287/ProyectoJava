package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.EvaluadorEjeCapacidad;

public record EvaluadorEjeCupoDTO(
    Long id,
    String ejeTematico,
    int capacidadMax,
    int restantes,
    boolean activo,
    /** Trabajos asignados en este eje aún sin dictamen (consumen cupo). */
    int pendientesDictamen) {

  public static EvaluadorEjeCupoDTO from(EvaluadorEjeCapacidad c, int pendientesDictamen) {
    return from(c, pendientesDictamen, c.getRestantes());
  }

  /** Vista reconciliada sin persistir (seguro en GET de listados). */
  public static EvaluadorEjeCupoDTO from(
      EvaluadorEjeCapacidad c, int pendientesDictamen, int restantesVista) {
    return new EvaluadorEjeCupoDTO(
        c.getId(),
        c.getEjeTematico(),
        c.getCapacidadMax(),
        Math.max(0, restantesVista),
        c.isActivo(),
        Math.max(0, pendientesDictamen));
  }
}
