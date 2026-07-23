/** Defaults de alta de actividades admin (última creación del mismo tipo). */

export type TipoAltaActividad =
  | 'MESA_TEMATICA'
  | 'MESA_REDONDA'
  | 'POSTER'
  | 'TALLER'
  | 'CONFERENCIA';

export interface UltimaAltaActividad {
  tipo: TipoAltaActividad;
  aulaId?: number | null;
  fecha?: string | null;
  franjaId?: number | null;
}

const STORAGE_KEY = 'jyaa.admin.ultimaAltaActividad';

export function leerUltimaAlta(tipo: TipoAltaActividad): UltimaAltaActividad | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as UltimaAltaActividad;
    if (!data || data.tipo !== tipo) return null;
    return data;
  } catch {
    return null;
  }
}

export function guardarUltimaAlta(data: UltimaAltaActividad): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Aplica aula/fecha/franja guardados si siguen siendo válidos. */
export function aplicarDefaultsAlta(
  tipo: TipoAltaActividad,
  opts: {
    fechas: string[];
    aulaIds: number[];
    franjaIdsDelDia: (fecha: string) => number[];
  }
): { aulaId: number | null; fecha: string | null; franjaId: number | null } {
  const ultima = leerUltimaAlta(tipo);
  const fechaDefault = opts.fechas[0] ?? null;
  const fecha =
    ultima?.fecha && opts.fechas.includes(ultima.fecha) ? ultima.fecha : fechaDefault;

  let aulaId: number | null = null;
  if (ultima?.aulaId != null && opts.aulaIds.includes(ultima.aulaId)) {
    aulaId = ultima.aulaId;
  }

  let franjaId: number | null = null;
  if (fecha) {
    const franjas = opts.franjaIdsDelDia(fecha);
    if (ultima?.franjaId != null && franjas.includes(ultima.franjaId)) {
      franjaId = ultima.franjaId;
    } else if (franjas.length) {
      franjaId = franjas[0];
    }
  }

  return { aulaId, fecha, franjaId };
}
