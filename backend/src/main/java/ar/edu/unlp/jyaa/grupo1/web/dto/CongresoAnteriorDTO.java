package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.CongresoAnterior;

public record CongresoAnteriorDTO(
    Long id,
    int anio,
    String titulo,
    String ubicacion,
    String fechaEtiqueta,
    String destacado,
    String urlSitio,
    String urlMemorias,
    int orden) {

  public static CongresoAnteriorDTO from(CongresoAnterior c) {
    return new CongresoAnteriorDTO(
        c.getId(),
        c.getAnio(),
        c.getTitulo(),
        c.getUbicacion(),
        c.getFechaEtiqueta(),
        c.getDestacado(),
        c.getUrlSitio(),
        c.getUrlMemorias(),
        c.getOrden());
  }
}
