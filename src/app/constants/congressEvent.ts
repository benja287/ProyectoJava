/** Talleres cargados por administración en el programa oficial (distinto de propuestas evaluadas). */
export const TALLERES_PROGRAMADOS_KEY = 'congress_talleres_programados';

/** Conferencias cargadas por administración en el programa oficial. */
export const CONFERENCIAS_KEY = 'congress_conferencias_programa';

/** Flag de publicación del programa público. */
export const PROGRAM_PUBLISHED_KEY = 'congress_program_published';

/**
 * Fecha (YYYY-MM-DD, calendario local) desde la cual los usuarios pueden generar/imprimir
 * certificados de asistencia. La define solo administración en el panel.
 */
export const CERTIFICATES_AVAILABLE_FROM_KEY = 'congress_certificates_available_from';

/** Disparado al guardar la fecha en localStorage para refrescar Header y CertificateView sin recargar. */
export const CERTIFICATE_SETTINGS_CHANGED_EVENT = 'congress-certificate-settings-changed';

/**
 * Si el usuario cerró el aviso “esperando fecha” en el Header, guardamos la ISO YYYY-MM-DD vigente en ese momento.
 * Si el admin cambia la fecha, la clave ya no coincide y el aviso vuelve a mostrarse.
 */
export const CERT_WAIT_HEADER_BANNER_DISMISSED_FOR_KEY = 'congress_cert_wait_banner_dismissed_iso';

function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Lee la fecha de habilitación de certificados desde localStorage (null = no configurada). */
export function getCertificatesAvailableFromDate(): string | null {
  const raw = localStorage.getItem(CERTIFICATES_AVAILABLE_FROM_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed)) return parsed;
  } catch {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  }
  return null;
}

/**
 * Persiste o borra la fecha y notifica a la UI (Header, certificados).
 * Pasar null o string vacío borra la clave (queda “sin definir”).
 */
export function setCertificatesAvailableFromDate(isoDate: string | null): void {
  const trimmed = isoDate?.trim() ?? '';
  if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    localStorage.removeItem(CERTIFICATES_AVAILABLE_FROM_KEY);
  } else {
    localStorage.setItem(CERTIFICATES_AVAILABLE_FROM_KEY, JSON.stringify(trimmed));
  }
  window.dispatchEvent(new CustomEvent(CERTIFICATE_SETTINGS_CHANGED_EVENT));
}

/** true solo si hay fecha configurada y hoy (local) es ese día o posterior. */
export function areCertificatesDownloadEnabled(): boolean {
  const from = getCertificatesAvailableFromDate();
  if (!from) return false;
  return todayLocalISO() >= from;
}

/** Texto legible para avisos (fecha sin hora, coherente con el resto del sitio). */
export function formatCertificatesAvailableFromEsAR(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

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
