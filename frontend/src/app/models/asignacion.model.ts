export interface AsignacionEvaluacion {
  id: number;
  aceptada: boolean;
  fechaRespuesta?: string | null;
  trabajoId?: number;
  trabajoTitulo?: string;
  trabajoEstado?: string;
  trabajoEjeTematico?: string;
  trabajoDocumentoUrl?: string | null;
  trabajoDocumentoDocxUrl?: string | null;
  trabajoTipo?: string;
  trabajoModalidad?: string;
  trabajoResumen?: string;
  trabajoMetodologia?: string;
  evaluadorId?: number;
  evaluadorNombre?: string;
  evaluadorApellido?: string;
  evaluadorEmail?: string | null;
  evaluacionId?: number | null;
  evaluacionRecomendacion?: string | null;
  evaluacionComentario?: string | null;
  evaluacionComentarioComite?: string | null;
  evaluacionModalidadRecomendada?: string | null;
  evaluacionRubricaJson?: string | null;
  evaluacionArchivoCorreccionUrl?: string | null;
  evaluacionArchivoCorreccionNombre?: string | null;
}

export interface PaginaAsignaciones {
  items: AsignacionEvaluacion[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface ResumenAsignacionesEvaluador {
  pendientes: number;
  evaluadas: number;
  aprobadas: number;
}

export interface AsignacionRequest {
  trabajoId: number;
  evaluadorId: number;
}
