export interface CongresoConfig {
  nombre?: string | null;
  edicion?: string | null;
  sede?: string | null;
  programaPublicado: boolean;
  certificadosDisponiblesDesde: string | null;
  envioTrabajosHasta?: string | null;
  congresoDesde?: string | null;
  congresoHasta?: string | null;
  inscripcionesDesde?: string | null;
  inscripcionesHasta?: string | null;
  evaluacionHasta?: string | null;
}

/** Año del evento desde congresoDesde, o fallback. */
export function anioCongreso(config?: CongresoConfig | null, fallback = 2027): number {
  const desde = config?.congresoDesde;
  if (desde && /^\d{4}/.test(desde)) {
    return Number(desde.slice(0, 4));
  }
  return fallback;
}

export function etiquetaSedeAnio(config?: CongresoConfig | null): string {
  const sede = config?.sede?.trim() || 'La Plata';
  return `${sede} ${anioCongreso(config)}`;
}
