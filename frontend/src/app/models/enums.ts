export const ROLES = [
  'ASISTENTE',
  'PARTICIPANTE',
  'AUTOR',
  'EVALUADOR',
  'ORGANIZADOR_CIENTIFICO',
  'ADMINISTRADOR',
] as const;

export type Rol = (typeof ROLES)[number];

export const TIPOS_TRABAJO = [
  'TRABAJO_CIENTIFICO',
  'RELATO_DE_EXPERIENCIA',
  'PROPUESTA_TALLER',
] as const;

export const TIPOS_ACTIVIDAD = [
  'MESA_TEMATICA',
  'MESA_REDONDA',
  'POSTER',
  'TALLER',
  'CONFERENCIA',
] as const;

export const METODOS_PAGO = ['TRANSFERENCIA', 'TARJETA', 'EFECTIVO'] as const;

export const ESTADOS_PAGO = ['PENDIENTE', 'APROBADO', 'RECHAZADO'] as const;

export const ESTADOS_TRABAJO = [
  'BORRADOR',
  'ENVIADO',
  'EN_EVALUACION',
  'APROBADO',
  'APROBADO_CON_CORRECCIONES',
  'RECHAZADO',
  'NOTIFICADO',
] as const;
