export interface CongresoConfig {
  programaPublicado: boolean;
  certificadosDisponiblesDesde: string | null;
  envioTrabajosHasta?: string | null;
  congresoDesde?: string | null;
  congresoHasta?: string | null;
  inscripcionesDesde?: string | null;
  inscripcionesHasta?: string | null;
  evaluacionHasta?: string | null;
}
