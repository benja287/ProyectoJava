export interface Circular {
  id: number;
  titulo: string;
  contenido: string;
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
