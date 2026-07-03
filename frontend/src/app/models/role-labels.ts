/** Etiquetas legibles para los roles del backend (como en React). */
export const ROLE_LABELS: Record<string, string> = {
  ASISTENTE: 'Asistente',
  PARTICIPANTE: 'Participante (legacy)',
  AUTOR: 'Autor',
  EVALUADOR: 'Evaluador',
  ORGANIZADOR_CIENTIFICO: 'Organizador científico',
  ADMINISTRADOR: 'Administrador',
};

export function etiquetaRol(rol: string): string {
  return ROLE_LABELS[rol] ?? rol;
}

export const ROLE_DESCRIPCIONES: Record<string, string> = {
  ASISTENTE:
    'Asistente al congreso: enviar trabajos, proponer talleres, cronograma y certificado.',
  PARTICIPANTE: 'Rol legacy — usar Asistente.',
  AUTOR: 'Crear y enviar trabajos científicos.',
  EVALUADOR: 'Aceptar o rechazar asignaciones de evaluación.',
  ORGANIZADOR_CIENTIFICO: 'Asignar trabajos a evaluadores y promover evaluadores.',
  ADMINISTRADOR: 'Usuarios, pagos, actividades y limpieza de datos.',
};

/** Roles operativos del congreso (post inscripción aprobada). */
export const ROLES_ASISTENTE_CONGRESO = ['ASISTENTE', 'PARTICIPANTE'] as const;
