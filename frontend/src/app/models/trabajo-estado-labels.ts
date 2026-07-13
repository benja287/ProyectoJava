import { ESTADOS_TRABAJO } from './enums';

/**
 * Etiquetas legibles para estados de trabajo (como ROLE_LABELS para roles).
 * El valor técnico del backend se mantiene; en UI se muestra el texto claro.
 */
export const ESTADO_TRABAJO_LABELS: Record<(typeof ESTADOS_TRABAJO)[number], string> = {
  BORRADOR: 'Borrador',
  ENVIADO: 'Enviado — pendiente de prevalidación',
  PRECHECK_OK: 'Prevalidación aprobada',
  PRECHECK_OBSERVADO: 'Observado en prevalidación',
  EN_EVALUACION: 'En evaluación',
  PENDIENTE_APROBACION_COMITE: 'Pendiente de dictamen del comité',
  APROBADO: 'Aprobado',
  OBSERVADO_EVALUACION: 'Requiere correcciones (evaluación)',
  RECHAZADO: 'Rechazado',
  NOTIFICADO: 'Presentación notificada',
  PROGRAMADO: 'Programado en el cronograma',
};

/** Labels más cortos para filtros / selects. */
export const ESTADO_TRABAJO_LABELS_FILTRO: Record<(typeof ESTADOS_TRABAJO)[number], string> = {
  BORRADOR: 'Borrador',
  ENVIADO: 'Enviado',
  PRECHECK_OK: 'Prevalidación OK',
  PRECHECK_OBSERVADO: 'Observado (prevalidación)',
  EN_EVALUACION: 'En evaluación',
  PENDIENTE_APROBACION_COMITE: 'Pendiente dictamen',
  APROBADO: 'Aprobado',
  OBSERVADO_EVALUACION: 'Correcciones (evaluación)',
  RECHAZADO: 'Rechazado',
  NOTIFICADO: 'Notificado',
  PROGRAMADO: 'Programado',
};

export function etiquetaEstadoTrabajo(estado?: string | null): string {
  if (!estado) {
    return '—';
  }
  return ESTADO_TRABAJO_LABELS[estado as (typeof ESTADOS_TRABAJO)[number]] ?? estado;
}

/** Opciones de filtro/select: value = código técnico, label = texto claro. */
export function opcionesEstadoTrabajo(
  estados: readonly string[] = ESTADOS_TRABAJO
): { value: string; label: string }[] {
  return estados.map((e) => ({
    value: e,
    label: ESTADO_TRABAJO_LABELS_FILTRO[e as (typeof ESTADOS_TRABAJO)[number]] ?? e,
  }));
}

/** Clase CSS del badge de estado (paneles comité / listados). */
export function claseEstadoTrabajoBadge(estado?: string | null): string {
  const map: Record<string, string> = {
    BORRADOR: 'estado-badge--enviado',
    ENVIADO: 'estado-badge--enviado',
    PRECHECK_OK: 'estado-badge--precheck-ok',
    PRECHECK_OBSERVADO: 'estado-badge--observado',
    EN_EVALUACION: 'estado-badge--evaluacion',
    PENDIENTE_APROBACION_COMITE: 'estado-badge--pendiente',
    APROBADO: 'estado-badge--aprobado',
    OBSERVADO_EVALUACION: 'estado-badge--observado-evaluacion',
    RECHAZADO: 'estado-badge--rechazado',
    NOTIFICADO: 'estado-badge--aprobado',
    PROGRAMADO: 'estado-badge--aprobado',
  };
  return estado ? map[estado] ?? 'estado-badge--enviado' : 'estado-badge--enviado';
}
