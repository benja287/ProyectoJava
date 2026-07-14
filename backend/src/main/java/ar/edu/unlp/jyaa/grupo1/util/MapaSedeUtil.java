package ar.edu.unlp.jyaa.grupo1.util;

/**
 * Rango del mapa del congreso: caja ~1,5 km de lado alrededor del centro de la sede.
 * Debe coincidir con el frontend ({@code sede-mapa.ts}).
 */
public final class MapaSedeUtil {

  /** Mitad del lado en grados de latitud (~750 m). */
  public static final double MITAD_LADO_LAT = 0.0068;

  /** Fallback semilla (FCAyF — UNLP, La Plata) si aún no hay ubicación guardada. */
  public static final double DEFAULT_LAT = -34.9112;

  public static final double DEFAULT_LNG = -57.9420;

  private MapaSedeUtil() {}

  public static double mitadLadoLng(double latitudCentro) {
    double cos = Math.cos(Math.toRadians(latitudCentro));
    if (Math.abs(cos) < 1e-6) {
      return MITAD_LADO_LAT;
    }
    return MITAD_LADO_LAT / cos;
  }

  public static boolean puntoEnRango(
      double lat, double lng, double centroLat, double centroLng) {
    double dLng = mitadLadoLng(centroLat);
    return lat >= centroLat - MITAD_LADO_LAT
        && lat <= centroLat + MITAD_LADO_LAT
        && lng >= centroLng - dLng
        && lng <= centroLng + dLng;
  }
}
