import { Trabajo } from '../models/trabajo.model';

export function esEnvioAsistente(t: Pick<Trabajo, 'rolEnvio'>): boolean {
  return t.rolEnvio === 'ASISTENTE' || !t.rolEnvio;
}

export function etiquetaRolEnvio(t: Pick<Trabajo, 'rolEnvio'>): string {
  return esEnvioAsistente(t) ? 'Asistente' : 'Autor';
}

export function participanteRolEnvio(t: Pick<Trabajo, 'rolEnvio'>): string {
  return esEnvioAsistente(t) ? 'asistente' : 'autor';
}

export function mensajeComitePrecheckObservado(t: Trabajo): string {
  const intentos = Math.min(t.precheckIntentos ?? 0, 3);
  if (esEnvioAsistente(t)) {
    return (
      `Este trabajo fue observado en precheck (${intentos}/3) y fue enviado como asistente. ` +
      `El participante aún no tiene rol Autor habilitado: debe corregirlo y reenviarlo desde el ` +
      `panel asistente antes de una nueva prevalidación.`
    );
  }
  return (
    `Este trabajo fue observado en precheck (${intentos}/3) y fue enviado como autor. ` +
    `Debe corregirlo y reenviarlo desde Mis trabajos antes de una nueva prevalidación.`
  );
}

export function mensajeComiteEvaluacionObservado(t: Trabajo): string {
  const revision = Math.min(t.revisionIntentos ?? 0, 2);
  if (esEnvioAsistente(t)) {
    return (
      `Un evaluador rechazó este trabajo (${revision}/2 reenvíos). Fue enviado como asistente: ` +
      `el participante debe corregirlo y reenviarlo desde el panel asistente. Tras dos evaluaciones ` +
      `favorables y el dictamen final del comité, el administrador podrá habilitar el rol Autor.`
    );
  }
  return (
    `Un evaluador rechazó este trabajo (${revision}/2 reenvíos). Fue enviado como autor: ` +
    `debe corregirlo y reenviarlo desde Mis trabajos para una nueva evaluación.`
  );
}

export function feedbackTextoTrabajo(t: Trabajo, vista: 'asistente' | 'autor'): string {
  const esAsistente = esEnvioAsistente(t);

  if (t.estado === 'ENVIADO' && (t.precheckIntentos ?? 0) === 0) {
    return esAsistente
      ? 'Trabajo enviado como asistente. Esperando prevalidación del Comité Académico.'
      : 'Trabajo enviado como autor. Esperando prevalidación del Comité Académico.';
  }
  if (t.estado === 'PRECHECK_OBSERVADO') {
    if (vista === 'asistente' || esAsistente) {
      return 'Observado en precheck (envío como asistente). Corregí y reenviá desde acá. Si el trabajo se aprueba, el administrador te habilitará el rol Autor.';
    }
    return 'Observado en precheck (envío como autor). Corregí y reenviá desde Mis trabajos.';
  }
  if (t.estado === 'OBSERVADO_EVALUACION') {
    if (vista === 'asistente' || esAsistente) {
      return 'Rechazado por un evaluador (envío como asistente). Corregí y reenviá. Tras la aprobación final, el admin te habilitará el rol Autor si corresponde.';
    }
    return 'Rechazado por un evaluador (envío como autor). Corregí y reenviá para nueva evaluación.';
  }
  if (t.estado === 'PENDIENTE_APROBACION_COMITE') {
    return esAsistente
      ? 'Evaluaciones favorables. Pendiente del dictamen final del comité. Si se aprueba, el administrador te habilitará el rol Autor.'
      : 'Evaluaciones favorables. Pendiente de confirmación final del comité.';
  }
  if (t.estado === 'EN_EVALUACION') {
    return 'En evaluación por los evaluadores asignados.';
  }
  if (t.estado === 'APROBADO') {
    return esAsistente
      ? 'Trabajo aprobado por el comité. El administrador debe habilitarte el rol Autor para gestionar trabajos como autor.'
      : 'Trabajo aprobado por el comité académico.';
  }
  if (t.estado === 'PRECHECK_OK') {
    return 'Precheck aprobado. El comité asignará evaluadores.';
  }
  if (t.estado === 'RECHAZADO') {
    return 'Trabajo rechazado de forma definitiva.';
  }
  return '';
}
