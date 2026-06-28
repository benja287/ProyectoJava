export interface Trabajo {
  id?: number;
  titulo: string;
  resumen?: string;
  ejeTematico?: string;
  tipo: string;
  estado?: string;
  documentoUrl?: string | null;
  fechaCreacion?: string;
  coautores?: string[];
  autorId?: number;
  autorNombre?: string;
  autorApellido?: string;
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
    tipo: string;
    coautores?: string[];
  };
}
