import { Aula } from '../models/aula.model';

/** Link OpenStreetMap: preferí coordenadas; si no, búsqueda por texto. */
export function urlMapaAula(aula: Pick<Aula, 'nombre' | 'ubicacion' | 'latitud' | 'longitud'>): string | null {
  if (aula.latitud != null && aula.longitud != null) {
    return `https://www.openstreetmap.org/?mlat=${aula.latitud}&mlon=${aula.longitud}#map=18/${aula.latitud}/${aula.longitud}`;
  }
  const q = [aula.ubicacion, aula.nombre, 'FCAyF UNLP La Plata'].filter(Boolean).join(', ');
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
