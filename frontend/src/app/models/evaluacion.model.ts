import { AsignacionEvaluacion } from './asignacion.model';

/** Decisión final del PDF (mapea a RecomendacionEvaluacion del backend). */
export const DECISIONES_EVALUACION = [
  {
    value: 'APROBADO',
    label: 'Aceptado sin modificaciones',
  },
  {
    value: 'APROBADO_CON_CORRECCIONES',
    label: 'Aceptado, pero se sugieren modificaciones menores',
  },
  {
    value: 'RECHAZADO',
    label: 'Precisa modificaciones profundas y volver a revisar',
  },
] as const;

export const MODALIDADES_RECOMENDADAS = [
  { value: 'ORAL', label: 'Oral' },
  { value: 'POSTER', label: 'Póster' },
  { value: 'INDECISO', label: 'Indecisx / sin preferencia' },
] as const;

export type SiNo = 'SI' | 'NO';
export type SiNoNa = 'SI' | 'NO' | 'RELATO_SIN_BIBLIOGRAFIA';
export type Pertinencia = 'SI' | 'SI_CORRECCIONES' | 'NO';
export type IdentidadAutor = 'IDENTIFICADO' | 'DESCONOZCO' | 'CONFLICTO_INTERESES';

export interface CriterioRubrica {
  valor: string;
  sugerencia?: string;
}

/** Rúbrica alineada al formulario PDF de evaluación. */
export interface RubricaEvaluacion {
  general: {
    pertinencia: Pertinencia | '';
    identidadAutor: IdentidadAutor | '';
    ejeCorrecto: SiNo | '';
  };
  forma: {
    lenguaje: CriterioRubrica;
    titulo: CriterioRubrica;
    resumen: CriterioRubrica;
    palabrasClave: CriterioRubrica;
  };
  bibliografia: {
    formatoApa: CriterioRubrica;
    coherenciaCitas: CriterioRubrica;
  };
  tipoSegunEvaluador: 'CIENTIFICO' | 'RELATO' | '';
  contenidoCientifico: {
    introduccion: CriterioRubrica;
    objetivos: CriterioRubrica;
    metodologia: CriterioRubrica;
    resultadosDiscusion: CriterioRubrica;
    tablasFiguras: CriterioRubrica;
    conclusiones: CriterioRubrica;
  };
}

export function rubricaVacia(): RubricaEvaluacion {
  const c = (): CriterioRubrica => ({ valor: '', sugerencia: '' });
  return {
    general: { pertinencia: '', identidadAutor: '', ejeCorrecto: '' },
    forma: {
      lenguaje: c(),
      titulo: c(),
      resumen: c(),
      palabrasClave: c(),
    },
    bibliografia: {
      formatoApa: c(),
      coherenciaCitas: c(),
    },
    tipoSegunEvaluador: '',
    contenidoCientifico: {
      introduccion: c(),
      objetivos: c(),
      metodologia: c(),
      resultadosDiscusion: c(),
      tablasFiguras: c(),
      conclusiones: c(),
    },
  };
}

export interface EvaluacionDictamenRequest {
  asignacionId: number;
  recomendacion: string;
  comentario?: string | null;
  comentarioComite?: string | null;
  modalidadRecomendada?: string | null;
  rubricaJson?: string | null;
}

export interface EvaluacionRegistrada {
  id: number;
  asignacionId?: number;
  recomendacion?: string;
  comentario?: string | null;
  comentarioComite?: string | null;
  modalidadRecomendada?: string | null;
  rubricaJson?: string | null;
  archivoCorreccionUrl?: string | null;
  archivoCorreccionNombre?: string | null;
  fecha?: string;
}

export function etiquetaDecisionEvaluacion(codigo?: string | null): string {
  if (!codigo) return '—';
  const found = DECISIONES_EVALUACION.find((d) => d.value === codigo);
  return found?.label ?? codigo;
}

/** El adjunto de correcciones aplica si hay cambios (menores o profundos). */
export function permiteArchivoCorreccionEvaluacion(recomendacion?: string | null): boolean {
  return (
    recomendacion === 'APROBADO_CON_CORRECCIONES' || recomendacion === 'RECHAZADO'
  );
}

export function etiquetaModalidadRecomendada(codigo?: string | null): string {
  if (!codigo) return '—';
  const found = MODALIDADES_RECOMENDADAS.find((m) => m.value === codigo);
  return found?.label ?? codigo;
}

export type AsignacionConDictamen = AsignacionEvaluacion & {
  evaluadorEmail?: string | null;
  evaluacionId?: number | null;
  evaluacionComentarioComite?: string | null;
  evaluacionModalidadRecomendada?: string | null;
  evaluacionRubricaJson?: string | null;
  evaluacionArchivoCorreccionUrl?: string | null;
  evaluacionArchivoCorreccionNombre?: string | null;
};
