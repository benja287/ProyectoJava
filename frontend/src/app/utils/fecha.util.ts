/** Formatea inicio/fin de actividad (ISO string o array Jackson [y,m,d,h,min]). */
export function formatFechaActividad(valor: unknown): string {
  if (valor == null || valor === '') {
    return '—';
  }
  if (typeof valor === 'string') {
    return valor.replace('T', ' ').slice(0, 16);
  }
  if (Array.isArray(valor) && valor.length >= 5) {
    const [y, m, d, h, min] = valor;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${y}-${pad(m)}-${pad(d)} ${pad(h)}:${pad(min)}`;
  }
  return String(valor);
}

/** Clave ISO YYYY-MM-DD para agrupar actividades por día. */
export function fechaClaveActividad(inicio: unknown): string {
  const s = formatFechaActividad(inicio);
  if (s === '—') return '';
  return s.includes(' ') ? s.split(' ')[0] : s.slice(0, 10);
}

/** Hora HH:mm de una actividad. */
export function horaActividad(valor: unknown): string {
  const s = formatFechaActividad(valor);
  const part = s.split(' ')[1];
  return part ? part.slice(0, 5) : '—';
}

/** Etiqueta legible: "lunes, 10 de mayo de 2027". */
export function etiquetaFechaCongreso(fechaIso: string): string {
  const d = new Date(`${fechaIso}T12:00:00`);
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
