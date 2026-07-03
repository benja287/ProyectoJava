export const CONGRESS_EVENT_DATES = ['2027-05-10', '2027-05-11', '2027-05-12'] as const;

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
