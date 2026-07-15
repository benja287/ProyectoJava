package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.SolicitudEvaluadorCapacidad;

public record CapacidadEjeDTO(String ejeTematico, int capacidad) {
  public static CapacidadEjeDTO from(SolicitudEvaluadorCapacidad c) {
    return new CapacidadEjeDTO(c.getEjeTematico(), c.getCapacidad());
  }
}
