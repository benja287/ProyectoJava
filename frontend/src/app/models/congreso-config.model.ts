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

/**
 * Jackson a veces serializa LocalDate como [y, m, d]. Los &lt;input type="date"&gt;
 * necesitan "yyyy-MM-dd".
 */
export function fechaApiAIso(value: unknown): string | null {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'string') {
    const s = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      return s.slice(0, 10);
    }
    return s || null;
  }
  if (Array.isArray(value) && value.length >= 3) {
    const y = Number(value[0]);
    const m = Number(value[1]);
    const d = Number(value[2]);
    if (!y || !m || !d) {
      return null;
    }
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return null;
}

export function normalizarCongresoConfig(raw: CongresoConfig): CongresoConfig {
  return {
    ...raw,
    certificadosDisponiblesDesde: fechaApiAIso(raw.certificadosDisponiblesDesde),
    envioTrabajosHasta: fechaApiAIso(raw.envioTrabajosHasta),
    congresoDesde: fechaApiAIso(raw.congresoDesde),
    congresoHasta: fechaApiAIso(raw.congresoHasta),
    inscripcionesDesde: fechaApiAIso(raw.inscripcionesDesde),
    inscripcionesHasta: fechaApiAIso(raw.inscripcionesHasta),
    evaluacionHasta: fechaApiAIso(raw.evaluacionHasta),
  };
}

/** Año del evento desde congresoDesde, o fallback. */
export function anioCongreso(config?: CongresoConfig | null, fallback = 2027): number {
  const desde = fechaApiAIso(config?.congresoDesde);
  if (desde && /^\d{4}/.test(desde)) {
    return Number(desde.slice(0, 4));
  }
  return fallback;
}

export function etiquetaSedeAnio(config?: CongresoConfig | null): string {
  const sede = config?.sede?.trim() || 'La Plata';
  return `${sede} ${anioCongreso(config)}`;
}
