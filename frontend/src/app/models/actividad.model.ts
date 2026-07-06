export interface Actividad {
  id?: number;
  titulo: string;
  sala?: string;
  inicio?: string;
  fin?: string;
  tipoActividad: string;
  codigo?: string;
  descripcion?: string;
  ejeTematico?: string;
  moderador?: string;
  panelistas?: string;
  responsables?: string;
  conferencistas?: string;
  institucion?: string;
}

export interface PaginaActividades {
  items: Actividad[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface CrearMesaRedondaRequest {
  titulo: string;
  ejeTematico?: string;
  moderador: string;
  panelistas?: string;
  descripcion?: string;
  sala: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

export interface CrearTallerOficialRequest {
  titulo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  sala: string;
  responsables: string;
  descripcion?: string;
  propuestaTallerId?: number;
}

export interface CrearConferenciaRequest {
  titulo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  sala: string;
  conferencistas: string;
  moderador?: string;
  institucion?: string;
  descripcion?: string;
}

export interface TrabajoCronogramaItem {
  id: number;
  titulo: string;
  ejeTematico?: string;
  tipo?: string;
  modalidad?: string;
  autorId?: number;
  autorNombre?: string;
  autorApellido?: string;
}

export interface ActividadCronograma extends Actividad {
  trabajos?: TrabajoCronogramaItem[];
}

export interface ActualizarActividadProgramaRequest {
  titulo?: string;
  sala?: string;
  inicio?: string;
  fin?: string;
  codigo?: string;
  descripcion?: string;
  ejeTematico?: string;
  moderador?: string;
  panelistas?: string;
  responsables?: string;
  conferencistas?: string;
  institucion?: string;
}
