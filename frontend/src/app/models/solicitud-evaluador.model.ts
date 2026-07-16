/** Constantes del formulario “Inscripción a comité de evaluadorxs”. */
export const TIPOS_IDENTIFICACION = [
  { value: 'DNI', label: 'DNI' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
] as const;

export const FORMACIONES_AGROECOLOGIA = [
  { value: 'GRADO', label: 'Grado' },
  { value: 'POSGRADO', label: 'Posgrado' },
  { value: 'DIPLOMATURA', label: 'Diplomatura' },
  { value: 'MAESTRIA', label: 'Maestría' },
  { value: 'DOCTORADO', label: 'Doctorado' },
  { value: 'NINGUNA', label: 'Ninguna' },
  { value: 'OTROS', label: 'Otros' },
] as const;

export const AREAS_CONOCIMIENTO = [
  { value: 'AGRICULTURA_INTENSIVA', label: 'Agricultura intensiva', grupo: 'agro' },
  { value: 'AGRICULTURA_EXTENSIVA', label: 'Agricultura extensiva', grupo: 'agro' },
  { value: 'AGRICULTURA_URBANA', label: 'Agricultura urbana', grupo: 'agro' },
  { value: 'GANADERIA', label: 'Ganadería', grupo: 'animal' },
  { value: 'APICULTURA', label: 'Apicultura', grupo: 'animal' },
  { value: 'SISTEMAS_MIXTOS', label: 'Sistemas mixtos', grupo: 'ambos' },
  { value: 'PUEBLOS_INDIGENAS', label: 'Pueblos indígenas', grupo: 'otro' },
  { value: 'GENERO', label: 'Género', grupo: 'otro' },
  { value: 'OTROS', label: 'Otros', grupo: 'otro' },
] as const;

export const SUBAREAS_AGRO = [
  { value: 'SUELO', label: 'Suelo' },
  { value: 'ORGANISMOS_PERJUDICIALES', label: 'Organismos perjudiciales' },
  { value: 'ENFERMEDADES', label: 'Enfermedades' },
  { value: 'BIODIVERSIDAD', label: 'Biodiversidad' },
  { value: 'BIOINSUMOS', label: 'Bioinsumos' },
  { value: 'COSECHA', label: 'Cosecha' },
  { value: 'CULTIVOS_SERVICIO', label: 'Cultivos de servicio' },
  { value: 'SEMILLAS', label: 'Semillas' },
  { value: 'MAQUINARIA', label: 'Maquinaria' },
  { value: 'OTROS', label: 'Otros' },
] as const;

export const SUBAREAS_ANIMAL = [
  { value: 'SANIDAD', label: 'Sanidad' },
  { value: 'NUTRICION', label: 'Nutrición' },
  { value: 'BIODIVERSIDAD', label: 'Biodiversidad' },
  { value: 'REPRODUCCION', label: 'Reproducción' },
  { value: 'OTROS', label: 'Otros' },
] as const;

export interface CapacidadEje {
  ejeTematico: string;
  capacidad: number;
}

export interface SolicitudEvaluador {
  id?: number;
  usuarioId?: number;
  usuarioNombre?: string;
  usuarioApellido?: string;
  estado?: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'REVOCADA' | string;
  fechaSolicitud?: string;
  fechaRevision?: string | null;
  revisadoPorId?: number | null;
  revisadoPorNombre?: string | null;
  motivoRechazo?: string | null;
  nombreCompleto: string;
  email: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nacionalidad: string;
  institucion?: string | null;
  evaluoEdicionesCongreso: boolean;
  evaluoOtrosCongresos: boolean;
  formacionAgroecologia: string;
  areasConocimiento: string[];
  subareas: string[];
  capacidades: CapacidadEje[];
  observaciones?: string | null;
  ejeAsignado?: string | null;
  invitacionTallerEnviada?: boolean;
}

export interface PaginaSolicitudesEvaluador {
  items: SolicitudEvaluador[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface SolicitudEvaluadorCreateRequest {
  nombreCompleto: string;
  email: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nacionalidad: string;
  institucion?: string;
  evaluoEdicionesCongreso: boolean;
  evaluoOtrosCongresos: boolean;
  formacionAgroecologia: string;
  areasConocimiento: string[];
  subareas: string[];
  capacidades: CapacidadEje[];
  observaciones?: string;
}

export interface ValidarSolicitudEvaluadorRequest {
  aprobar: boolean;
  motivoRechazo?: string;
  ejeAsignacion?: string;
  enviarInvitacionTaller?: boolean;
}
