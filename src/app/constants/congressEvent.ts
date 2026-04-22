/** Talleres cargados por administración en el programa oficial (distinto de propuestas evaluadas). */
export const TALLERES_PROGRAMADOS_KEY = 'congress_talleres_programados';

/** Conferencias cargadas por administración en el programa oficial. */
export const CONFERENCIAS_KEY = 'congress_conferencias_programa';

/** Flag de publicación del programa público. */
export const PROGRAM_PUBLISHED_KEY = 'congress_program_published';

/** Circulares del congreso (borrador / publicadas). */
export const CIRCULARES_KEY = 'congress_circulares';

export type CircularStatus = 'draft' | 'published';

export interface StoredCircular {
  id: string;
  number: string;
  date: string;
  title: string;
  summary: string;
  content: string;
  status: CircularStatus;
  updatedAt: string;
  pdfName?: string;
  pdfFileId?: string;
  pdfMimeType?: string;
  /** Base64 del PDF (sin prefijo data:) para compartir entre usuarios del mismo origen. */
  pdfData?: string;
}

/** Fechas hábiles del cronograma (3 días) — V Congreso UNLP La Plata 2027 (alineado al mock del proyecto). */
export const CONGRESS_EVENT_DATES = ['2027-05-10', '2027-05-11', '2027-05-12'] as const;

export type CongressDate = (typeof CONGRESS_EVENT_DATES)[number];

export function isCongressDate(date: string): boolean {
  return CONGRESS_EVENT_DATES.includes(date as CongressDate);
}

export function congressDateLabels(): { value: string; label: string }[] {
  return CONGRESS_EVENT_DATES.map((value) => ({
    value,
    label: new Date(`${value}T12:00:00`).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  }));
}

/** Horas en formato HH:mm */
const toMinutes = (time: string) => {
  const parts = time.split(':').map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  return h * 60 + m;
};

export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;
  return toMinutes(endTime) > toMinutes(startTime);
}

export function timeRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);
}

/**
 * Valida que no haya superposición horaria dentro de una misma entidad (mismo tipo) en una fecha.
 * Sirve para mesas temáticas, redondas, pósters, talleres y conferencias.
 */
export function hasTimeOverlap<T extends { id?: string; date?: string; fecha?: string; startTime: string; endTime: string }>(
  list: T[],
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): boolean {
  return list.some((it: any) => {
    const itDate = it.date ?? it.fecha;
    if (itDate !== date) return false;
    if (excludeId && it.id === excludeId) return false;
    return timeRangesOverlap(it.startTime, it.endTime, startTime, endTime);
  });
}

/** Leyenda tipo sitio del III CAAE: "Desde 10 may. 2027 - hasta 12 may. 2027" */
export function congressDateRangeCaption(): string {
  const dates = [...CONGRESS_EVENT_DATES];
  const first = dates[0];
  const last = dates[dates.length - 1];
  const d1 = new Date(`${first}T12:00:00`);
  const d2 = new Date(`${last}T12:00:00`);
  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  return `Desde ${d1.toLocaleDateString('es-AR', opts)} — hasta ${d2.toLocaleDateString('es-AR', opts)}`;
}
