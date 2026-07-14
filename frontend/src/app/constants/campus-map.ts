/** Bounds aproximados del campus FCAyF — UNLP (La Plata), ~1 km de lado. */
export const CAMPUS_MAP = {
  center: { lat: -34.9112, lng: -57.9420 } as const,
  /** Sur-Oeste */
  sw: { lat: -34.9185, lng: -57.9520 } as const,
  /** Norte-Este */
  ne: { lat: -34.9040, lng: -57.9320 } as const,
  defaultZoom: 16,
  minZoom: 14,
  maxZoom: 19,
} as const;

export function puntoEnCampus(lat: number, lng: number): boolean {
  return (
    lat >= CAMPUS_MAP.sw.lat &&
    lat <= CAMPUS_MAP.ne.lat &&
    lng >= CAMPUS_MAP.sw.lng &&
    lng <= CAMPUS_MAP.ne.lng
  );
}
