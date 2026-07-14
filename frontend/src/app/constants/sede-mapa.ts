/**
 * Rango del mapa de la sede (~500 m de lado, ~1/3 del tamaño anterior).
 * Debe coincidir con MapaSedeUtil del backend.
 */
export const SEDE_MAPA = {
  /** Mitad del lado en grados de latitud (~250 m). */
  mitadLadoLat: 0.0023,
  defaultZoom: 17,
  minZoomAcotado: 15,
  maxZoom: 19,
  defaultZoomLibre: 6,
  minZoomLibre: 3,
  /** Semilla / fallback (FCAyF — UNLP). */
  defaultCenter: { lat: -34.9112, lng: -57.9420 } as const,
} as const;

export type MapaPunto = { lat: number; lng: number };

export type MapaBounds = { sw: MapaPunto; ne: MapaPunto; center: MapaPunto };

export function mitadLadoLng(latitudCentro: number): number {
  const cos = Math.cos((latitudCentro * Math.PI) / 180);
  if (Math.abs(cos) < 1e-6) {
    return SEDE_MAPA.mitadLadoLat;
  }
  return SEDE_MAPA.mitadLadoLat / cos;
}

export function boundsDesdeCentro(centro: MapaPunto): MapaBounds {
  const dLng = mitadLadoLng(centro.lat);
  const h = SEDE_MAPA.mitadLadoLat;
  return {
    center: centro,
    sw: { lat: centro.lat - h, lng: centro.lng - dLng },
    ne: { lat: centro.lat + h, lng: centro.lng + dLng },
  };
}

export function puntoEnRango(lat: number, lng: number, centro: MapaPunto): boolean {
  const b = boundsDesdeCentro(centro);
  return lat >= b.sw.lat && lat <= b.ne.lat && lng >= b.sw.lng && lng <= b.ne.lng;
}

export function centroDesdeConfig(mapaLatitud?: number | null, mapaLongitud?: number | null): MapaPunto | null {
  if (mapaLatitud == null || mapaLongitud == null) {
    return null;
  }
  return { lat: mapaLatitud, lng: mapaLongitud };
}
