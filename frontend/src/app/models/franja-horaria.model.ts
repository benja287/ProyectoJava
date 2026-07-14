export interface FranjaHoraria {
  id?: number;
  diaCongreso: number;
  etiqueta?: string | null;
  horaInicio: string;
  horaFin: string;
  activa: boolean;
}

export interface FranjaHorariaRequest {
  diaCongreso: number;
  etiqueta?: string | null;
  horaInicio: string;
  horaFin: string;
  activa?: boolean;
}

export function etiquetaFranja(f: FranjaHoraria): string {
  const nombre = f.etiqueta?.trim() ? `${f.etiqueta.trim()}: ` : '';
  return `${nombre}${f.horaInicio} – ${f.horaFin}`;
}

/** Día lógico 1..N a partir del listado de fechas del congreso. */
export function diaCongresoDeFecha(fecha: string, fechasOrdenadas: string[]): number | null {
  const i = fechasOrdenadas.indexOf(fecha);
  return i >= 0 ? i + 1 : null;
}
