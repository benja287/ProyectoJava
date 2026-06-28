export interface Actividad {
  id?: number;
  titulo: string;
  sala?: string;
  inicio?: string;
  fin?: string;
  tipoActividad: string;
  codigo?: string;
}

export interface PaginaActividades {
  items: Actividad[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}
