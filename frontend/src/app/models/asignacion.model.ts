export interface AsignacionEvaluacion {
  id: number;
  aceptada: boolean;
  fechaRespuesta?: string | null;
  trabajoId?: number;
  trabajoTitulo?: string;
  trabajoEstado?: string;
  trabajoEjeTematico?: string;
  trabajoDocumentoUrl?: string | null;
  evaluadorId?: number;
  evaluadorNombre?: string;
  evaluadorApellido?: string;
  evaluacionRecomendacion?: string | null;
  evaluacionComentario?: string | null;
}

export interface AsignacionRequest {
  trabajoId: number;
  evaluadorId: number;
}
