import { Trabajo } from './trabajo.model';

export interface SolicitudAutor {
  usuarioId: number;
  nombre: string;
  apellido: string;
  email: string;
  trabajos: Trabajo[];
}
