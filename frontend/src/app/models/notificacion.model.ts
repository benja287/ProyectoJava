export interface Notificacion {
  id: number;
  asunto: string;
  mensaje: string;
  fechaCreacion: string;
  leida: boolean;
}

export interface AdminStats {
  totalUsuarios: number;
  inscripcionesPendientesPago: number;
  inscripcionesConfirmadas: number;
  trabajosPresentados: number;
  trabajosAprobados: number;
  propuestasTallerPendientes: number;
}

export interface ConteoLabel {
  label: string;
  count: number;
}

export interface InstitucionConteo {
  institution: string;
  count: number;
}

export interface DeudorInscripcion {
  id: number;
  nombre: string;
  email: string;
  metodoPago: string;
  categoria: string;
}

export interface AdminReportKpi {
  usuariosTotales: number;
  inscripcionesTotales: number;
  inscripcionesPendientes: number;
  inscripcionesConfirmadas: number;
  pagosEfectivoPendientes: number;
  pagosTransferenciaPendientes: number;
  pagosEfectivoConfirmados: number;
  pagosTransferenciaConfirmados: number;
  trabajosTotales: number;
}

export interface AdminReport {
  generatedAt: string;
  kpi: AdminReportKpi;
  trabajosPorTipo: ConteoLabel[];
  trabajosPorModalidad: ConteoLabel[];
  trabajosPorEstado: ConteoLabel[];
  inscripcionesPorInstitucionTop10: InstitucionConteo[];
  deudores: DeudorInscripcion[];
}
