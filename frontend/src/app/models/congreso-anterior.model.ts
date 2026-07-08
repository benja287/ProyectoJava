export interface CongresoAnterior {
  id: number;
  anio: number;
  titulo: string;
  ubicacion: string;
  fechaEtiqueta: string;
  destacado: string;
  urlSitio: string;
  urlMemorias?: string | null;
  orden: number;
}
