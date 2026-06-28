import { Actividad } from './actividad.model';

export interface Cronograma {
  id?: number;
  usuarioId?: number;
  usuarioNombre?: string;
  usuarioApellido?: string;
  actividades: Actividad[];
}
