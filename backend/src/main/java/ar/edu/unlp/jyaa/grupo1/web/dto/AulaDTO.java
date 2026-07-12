package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.Aula;

public record AulaDTO(
    Long id, String nombre, Integer capacidad, String ubicacion, boolean activa) {

  public static AulaDTO from(Aula a) {
    return new AulaDTO(a.getId(), a.getNombre(), a.getCapacidad(), a.getUbicacion(), a.isActiva());
  }
}
