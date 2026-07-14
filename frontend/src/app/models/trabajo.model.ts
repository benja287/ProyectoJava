export interface Trabajo {
  id?: number;
  titulo: string;
  resumen?: string;
  metodologia?: string;
  ejeTematico?: string;
  modalidad?: string;
  tipo: string;
  estado?: string;
  documentoUrl?: string | null;
  fechaCreacion?: string;
  coautores?: string[];
  autorId?: number;
  autorNombre?: string;
  autorApellido?: string;
  autorCategoria?: string;
  precheckIntentos?: number;
  revisionIntentos?: number;
  observacionesPrecheck?: string;
  rolEnvio?: string;
  asignacionesCount?: number;
  evaluacionesCompletas?: number;
  aprobaciones?: number;
  rechazos?: number;
}

export interface TrabajoEnvioResumen {
  trabajosEnviadosRol: number;
  totalHistorico: number;
  trabajosActivos: number;
  reenviosDisponibles: number;
  limiteActivos: number;
  puedeEnviarNuevo: boolean;
  bloqueadoPorDobleRol: boolean;
  mensajeBloqueo?: string | null;
  envioTrabajosHasta?: string | null;
  fechaLimitePasada: boolean;
}

export interface PresentacionAutor {
  trabajoId: number;
  trabajoTitulo: string;
  ejeTematico?: string;
  modalidad?: string;
  actividadId: number;
  actividadTitulo: string;
  actividadCodigo?: string;
  tipoActividad: 'MESA_TEMATICA' | 'POSTER' | string;
  sala?: string;
  inicio?: string;
  fin?: string;
  numeroPanel?: number | null;
}

/** Devolución anónima del evaluador (solo en OBSERVADO_EVALUACION). */
export interface DevolucionEvaluacionAutor {
  evaluacionId: number;
  recomendacion?: string | null;
  comentario?: string | null;
  modalidadRecomendada?: string | null;
  rubricaJson?: string | null;
  archivoCorreccionUrl?: string | null;
  archivoCorreccionNombre?: string | null;
  fecha?: string | null;
}

export interface PaginaTrabajos {
  items: Trabajo[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface TrabajoCreateRequest {
  autorId: number;
  trabajo: {
    titulo: string;
    resumen?: string;
    metodologia?: string;
    ejeTematico?: string;
    modalidad?: string;
    tipo: string;
    coautores?: string[];
  };
}

export interface CrearMesaTematicaRequest {
  codigo: string;
  titulo: string;
  sala?: string;
  inicio?: string;
  fin?: string;
  trabajoIds: number[];
  aulaId?: number;
  franjaId?: number;
}

export interface CrearSesionPostersRequest {
  titulo: string;
  ubicacion?: string;
  inicio?: string;
  fin?: string;
  trabajoIds: number[];
  aulaId?: number;
  franjaId?: number;
}
