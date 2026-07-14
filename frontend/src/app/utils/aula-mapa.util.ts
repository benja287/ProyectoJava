import { Aula } from '../models/aula.model';

/** Solo coords reales → pin OSM. */
export function urlMapaAulaCoords(
  aula: Pick<Aula, 'latitud' | 'longitud'> | null | undefined
): string | null {
  if (aula?.latitud == null || aula?.longitud == null) {
    return null;
  }
  return `https://www.openstreetmap.org/?mlat=${aula.latitud}&mlon=${aula.longitud}#map=18/${aula.latitud}/${aula.longitud}`;
}

/** Link OpenStreetMap: preferí coordenadas; si no, búsqueda por texto. */
export function urlMapaAula(aula: Pick<Aula, 'nombre' | 'ubicacion' | 'latitud' | 'longitud'>): string | null {
  const conCoords = urlMapaAulaCoords(aula);
  if (conCoords) {
    return conCoords;
  }
  const q = [aula.ubicacion, aula.nombre].filter(Boolean).join(', ');
  if (!q.trim()) {
    return null;
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(q)}`;
}

export function etiquetaMapaAula(aula: Pick<Aula, 'latitud' | 'longitud' | 'ubicacion'>): string {
  if (aula.latitud != null && aula.longitud != null) {
    return 'Ver en mapa';
  }
  if (aula.ubicacion?.trim()) {
    return 'Buscar en mapa';
  }
  return '';
}

export function aulaTieneCoords(aula: Pick<Aula, 'latitud' | 'longitud'> | null | undefined): boolean {
  return aula?.latitud != null && aula?.longitud != null;
}

/** Deep-link admin para editar ubicación de un aula. */
export function rutaEditarAulaAdmin(aulaId: number): { path: string; queryParams: { editarAula: number } } {
  return { path: '/admin/congreso', queryParams: { editarAula: aulaId } };
}
