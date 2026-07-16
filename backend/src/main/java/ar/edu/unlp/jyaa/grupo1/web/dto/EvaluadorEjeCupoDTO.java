package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.EvaluadorEjeCapacidad;

public record EvaluadorEjeCupoDTO(
    Long id, String ejeTematico, int capacidadMax, int restantes, boolean activo) {

  public static EvaluadorEjeCupoDTO from(EvaluadorEjeCapacidad c) {
    return new EvaluadorEjeCupoDTO(
        c.getId(), c.getEjeTematico(), c.getCapacidadMax(), c.getRestantes(), c.isActivo());
  }
}
