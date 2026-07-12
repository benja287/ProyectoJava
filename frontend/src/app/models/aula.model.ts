export interface Aula {
  id?: number;
  nombre: string;
  capacidad?: number | null;
  ubicacion?: string | null;
  activa: boolean;
}

export type AulaRequest = {
  nombre: string;
  capacidad?: number | null;
  ubicacion?: string | null;
  activa?: boolean;
};
