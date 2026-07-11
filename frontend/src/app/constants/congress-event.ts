/** Fallback si el admin aún no configuró inicio/fin del congreso (3 días). */
export const DEFAULT_CONGRESS_EVENT_DATES: string[] = [
  '2027-05-10',
  '2027-05-11',
  '2027-05-12',
];

/** Preferí buildCongressDates(desde, hasta) desde la config del congreso. */
export const CONGRESS_EVENT_DATES = DEFAULT_CONGRESS_EVENT_DATES;

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Genera los días inclusive entre desde y hasta. Si faltan, usa el fallback de 3 días. */
export function buildCongressDates(
  desde?: string | null,
  hasta?: string | null
): string[] {
  if (!desde || !hasta) {
    return [...DEFAULT_CONGRESS_EVENT_DATES];
  }
  const out: string[] = [];
  let cur = desde;
  let guard = 0;
  while (cur <= hasta && guard < 31) {
    out.push(cur);
    cur = addDaysYmd(cur, 1);
    guard++;
  }
  return out.length ? out : [...DEFAULT_CONGRESS_EVENT_DATES];
}

/** Fin del congreso = inicio + 2 días (3 días en total). */
export function finCongresoDesdeInicio(desde: string): string {
  return addDaysYmd(desde, 2);
}

export function isCongressDate(date: string, dates?: readonly string[]): boolean {
  const list = dates ?? DEFAULT_CONGRESS_EVENT_DATES;
  return list.includes(date);
}

export function congressDateLabels(dates?: readonly string[]): { value: string; label: string }[] {
  const list = dates ?? DEFAULT_CONGRESS_EVENT_DATES;
  return list.map((value) => ({
    value,
    label: new Date(`${value}T12:00:00`).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  }));
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;
  return toMinutes(endTime) > toMinutes(startTime);
}

/** Combina fecha YYYY-MM-DD y hora HH:mm en ISO local para el backend. */
export function toLocalDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}
