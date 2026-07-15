import { CategoriaInscripcion } from './inscripcion.model';

export interface ArancelCategoria {
  categoria: string;
  monto: number;
  moneda: string;
  etiqueta: string;
}

export interface ArancelesConfig {
  publicados: boolean;
  ventanaInscripcionAbierta: boolean;
  puedeInscribirseAhora: boolean;
  motivoBloqueo: string | null;
  aliasPago: string | null;
  qrPagoUrl: string | null;
  instruccionesPago: string | null;
  aranceles: ArancelCategoria[];
}

export interface ArancelesConfigUpdate {
  aliasPago?: string | null;
  instruccionesPago?: string | null;
  /** true publica, false despublica, omitir = solo guardar borrador */
  publicar?: boolean | null;
  aranceles: Array<{
    categoria: CategoriaInscripcion | string;
    monto: number;
    moneda: string;
  }>;
}

export function arancelDeCategoria(
  config: ArancelesConfig | null | undefined,
  categoria: string
): ArancelCategoria | null {
  if (!config?.aranceles?.length || !categoria) {
    return null;
  }
  return config.aranceles.find((a) => a.categoria === categoria) ?? null;
}
