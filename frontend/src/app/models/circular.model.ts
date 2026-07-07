export interface Circular {
  id: number;
  titulo: string;
  resumen?: string | null;
  contenido: string;
  documentoUrl?: string | null;
  documentoNombre?: string | null;
  publicada: boolean;
  fechaPublicacion?: string | null;
}

export interface PaginaCirculares {
  items: Circular[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}
