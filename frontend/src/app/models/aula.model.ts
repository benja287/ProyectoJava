export interface Aula {
  id?: number;
  nombre: string;
  capacidad?: number | null;
  ubicacion?: string | null;
  activa: boolean;
  latitud?: number | null;
  longitud?: number | null;
}

export type AulaRequest = {
  nombre: string;
  capacidad?: number | null;
  ubicacion?: string | null;
  activa?: boolean;
  latitud?: number | null;
  longitud?: number | null;
};
