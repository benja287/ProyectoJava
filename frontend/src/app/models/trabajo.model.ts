export interface Trabajo {
  id?: number;
  titulo: string;
  resumen?: string;
  ejeTematico?: string;
  modalidad?: string;
  tipo: string;
  estado?: string;
  documentoUrl?: string | null;
  fechaCreacion?: string;
  coautores?: string[];
  autorId?: number;
  autorNombre?: string;
  autorApellido?: string;
  precheckIntentos?: number;
}

export interface PaginaTrabajos {
  items: Trabajo[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface TrabajoCreateRequest {
  autorId: number;
  trabajo: {
    titulo: string;
    resumen?: string;
    ejeTematico?: string;
    modalidad?: string;
    tipo: string;
    coautores?: string[];
  };
}

export interface CrearMesaTematicaRequest {
  codigo: string;
  titulo: string;
  sala: string;
  inicio: string;
  fin: string;
  trabajoIds: number[];
}

export interface CrearSesionPostersRequest {
  titulo: string;
  ubicacion: string;
  inicio: string;
  fin: string;
  trabajoIds: number[];
}
