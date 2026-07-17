export interface CongresoConfig {
  nombre?: string | null;
  edicion?: string | null;
  sede?: string | null;
  mapaLatitud?: number | null;
  mapaLongitud?: number | null;
  programaPublicado: boolean;
  certificadosDisponiblesDesde: string | null;
  envioTrabajosHasta?: string | null;
  maxTrabajosAutor?: number;
  maxTrabajosAsistente?: number;
  congresoDesde?: string | null;
  congresoHasta?: string | null;
  inscripcionesDesde?: string | null;
  inscripcionesHasta?: string | null;
  evaluacionHasta?: string | null;
  /** Jornada global HH:mm */
  jornadaInicio?: string | null;
  jornadaFin?: string | null;
  jornadaInicioDia1?: string | null;
  jornadaFinDia1?: string | null;
  jornadaInicioDia2?: string | null;
  jornadaFinDia2?: string | null;
  jornadaInicioDia3?: string | null;
  jornadaFinDia3?: string | null;
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

/** Normaliza HH:mm o HH:mm:ss (o array Jackson raro) a "HH:mm". */
export function horaApiAHmm(value: unknown): string | null {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'string') {
    const s = value.trim();
    const m = /^(\d{1,2}):(\d{2})/.exec(s);
    if (!m) {
      return null;
    }
    return `${m[1].padStart(2, '0')}:${m[2]}`;
  }
  if (Array.isArray(value) && value.length >= 2) {
    const h = Number(value[0]);
    const min = Number(value[1]);
    if (!Number.isFinite(h) || !Number.isFinite(min)) {
      return null;
    }
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  return null;
}

export function jornadaEfectiva(
  config: CongresoConfig | null | undefined,
  dia: 1 | 2 | 3
): { inicio: string; fin: string } {
  const globalIni = horaApiAHmm(config?.jornadaInicio) || '09:00';
  const globalFin = horaApiAHmm(config?.jornadaFin) || '20:00';
  const oIni =
    dia === 1
      ? config?.jornadaInicioDia1
      : dia === 2
        ? config?.jornadaInicioDia2
        : config?.jornadaInicioDia3;
  const oFin =
    dia === 1
      ? config?.jornadaFinDia1
      : dia === 2
        ? config?.jornadaFinDia2
        : config?.jornadaFinDia3;
  return {
    inicio: horaApiAHmm(oIni) || globalIni,
    fin: horaApiAHmm(oFin) || globalFin,
  };
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
    jornadaInicio: horaApiAHmm(raw.jornadaInicio) || '09:00',
    jornadaFin: horaApiAHmm(raw.jornadaFin) || '20:00',
    jornadaInicioDia1: horaApiAHmm(raw.jornadaInicioDia1),
    jornadaFinDia1: horaApiAHmm(raw.jornadaFinDia1),
    jornadaInicioDia2: horaApiAHmm(raw.jornadaInicioDia2),
    jornadaFinDia2: horaApiAHmm(raw.jornadaFinDia2),
    jornadaInicioDia3: horaApiAHmm(raw.jornadaInicioDia3),
    jornadaFinDia3: horaApiAHmm(raw.jornadaFinDia3),
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
