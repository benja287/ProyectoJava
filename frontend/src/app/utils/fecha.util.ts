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
