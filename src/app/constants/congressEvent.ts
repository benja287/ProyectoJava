/** Talleres cargados por administración en el programa oficial (distinto de propuestas evaluadas). */
export const TALLERES_PROGRAMADOS_KEY = 'congress_talleres_programados';

/** Conferencias cargadas por administración en el programa oficial. */
export const CONFERENCIAS_KEY = 'congress_conferencias_programa';

/** Flag de publicación del programa público. */
export const PROGRAM_PUBLISHED_KEY = 'congress_program_published';

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
