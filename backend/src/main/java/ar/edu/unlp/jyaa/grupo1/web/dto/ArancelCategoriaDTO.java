package ar.edu.unlp.jyaa.grupo1.web.dto;

import ar.edu.unlp.jyaa.grupo1.modelo.ArancelCategoria;

public record ArancelCategoriaDTO(
    String categoria, double monto, String moneda, String etiqueta) {

  public static ArancelCategoriaDTO from(ArancelCategoria arancel) {
    String moneda = arancel.getMoneda() != null ? arancel.getMoneda() : "ARS";
    return new ArancelCategoriaDTO(
        arancel.getCategoria(),
        arancel.getMonto(),
        moneda,
        formatearEtiqueta(arancel.getMonto(), moneda));
  }

  public static String formatearEtiqueta(double monto, String moneda) {
    if ("USD".equalsIgnoreCase(moneda)) {
      if (Math.rint(monto) == monto) {
        return "USD " + String.format("%.0f", monto);
      }
      return "USD " + String.format("%.2f", monto);
    }
    if (Math.rint(monto) == monto) {
      return "$ " + String.format("%,.0f", monto).replace(',', '.');
    }
    return "$ " + String.format("%,.2f", monto);
  }
}
