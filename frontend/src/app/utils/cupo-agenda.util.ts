import { Actividad } from '../models/actividad.model';

/** Texto de cupo tipo `12/40`. Vacío si el aula no tiene capacidad. */
export function etiquetaCupoAgenda(
  a: Pick<Actividad, 'agendasOcupacion' | 'aulaCapacidad'> | null | undefined
): string | null {
  if (a == null || a.aulaCapacidad == null) {
    return null;
  }
  const ocup = a.agendasOcupacion ?? 0;
  return `${ocup}/${a.aulaCapacidad}`;
}

export function cupoAgendaCompleto(
  a: Pick<Actividad, 'agendasOcupacion' | 'aulaCapacidad'> | null | undefined
): boolean {
  if (a == null || a.aulaCapacidad == null) {
    return false;
  }
  return (a.agendasOcupacion ?? 0) >= a.aulaCapacidad;
}
