export interface AsignacionEvaluacion {
  id: number;
  aceptada: boolean;
  fechaRespuesta?: string | null;
  trabajoId?: number;
  trabajoTitulo?: string;
  trabajoEstado?: string;
  trabajoDocumentoUrl?: string | null;
  evaluadorId?: number;
  evaluadorNombre?: string;
  evaluadorApellido?: string;
}

export interface AsignacionRequest {
  trabajoId: number;
  evaluadorId: number;
}
