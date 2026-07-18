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
      `Este trabajo fue observado en prevalidación (${intentos}/3) y fue enviado como asistente. ` +
      `El participante aún no tiene rol Autor habilitado: debe corregirlo y reenviarlo desde el ` +
      `panel asistente antes de una nueva prevalidación.`
    );
  }
  return (
    `Este trabajo fue observado en prevalidación (${intentos}/3) y fue enviado como autor. ` +
    `Debe corregirlo y reenviarlo desde Mis trabajos antes de una nueva prevalidación.`
  );
}

export function mensajeComiteEvaluacionObservado(t: Trabajo): string {
  const revision = Math.min(t.revisionIntentos ?? 0, 2);
  if (esEnvioAsistente(t)) {
    return (
      `Los evaluadores rechazaron este trabajo (${revision}/2 reenvíos). Fue enviado como asistente: ` +
      `el participante debe corregirlo y reenviarlo desde el panel asistente. Tras dos evaluaciones ` +
      `favorables y el dictamen final del comité, el rol Autor se habilita automáticamente.`
    );
  }
  return (
    `Los evaluadores rechazaron este trabajo (${revision}/2 reenvíos). Fue enviado como autor: ` +
    `debe corregirlo y reenviarlo desde Mis trabajos para una nueva evaluación.`
  );
}

export function mensajeComiteEmpateEvaluacion(t: Trabajo): string {
  if (esEnvioAsistente(t)) {
    return (
      `Empate 1 a favor / 1 en contra. El trabajo sigue en evaluación: asigná un tercer evaluador ` +
      `del eje. No hace falta reenvío ni nueva prevalidación. Si el tercero aprueba, el trabajo ` +
      `pasa al dictamen final del comité (y al aprobarse se habilita el rol Autor).`
    );
  }
  return (
    `Empate 1 a favor / 1 en contra. El trabajo sigue en evaluación: asigná un tercer evaluador ` +
    `del eje. No hace falta reenvío ni nueva prevalidación. Si el tercero aprueba, el trabajo ` +
    `pasa al dictamen final del comité.`
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
      return 'Observado en prevalidación (envío como asistente). Corregí y reenviá desde acá. Si el comité aprueba el trabajo, el rol Autor se habilita automáticamente.';
    }
    return 'Observado en prevalidación (envío como autor). Corregí y reenviá desde Mis trabajos.';
  }
  if (t.estado === 'OBSERVADO_EVALUACION') {
    if (vista === 'asistente' || esAsistente) {
      return 'Rechazado por los evaluadores (envío como asistente). Corregí y reenviá. Si el comité aprueba el trabajo, el rol Autor se habilita automáticamente.';
    }
    return 'Rechazado por los evaluadores (envío como autor). Corregí y reenviá para nueva evaluación.';
  }
  if (t.estado === 'PENDIENTE_APROBACION_COMITE') {
    return esAsistente
      ? 'Evaluaciones favorables. Pendiente del dictamen final del comité. Si se aprueba, el rol Autor se habilita automáticamente.'
      : 'Evaluaciones favorables. Pendiente de confirmación final del comité.';
  }
  if (t.estado === 'EN_EVALUACION') {
    if (t.empateEvaluacion || ((t.aprobaciones ?? 0) === 1 && (t.rechazos ?? 0) === 1)) {
      return 'Empate 1/1 entre evaluadores. El comité asignará un tercer evaluador. No tenés que reenviar.';
    }
    return 'En evaluación por los evaluadores asignados.';
  }
  if (t.estado === 'APROBADO') {
    return esAsistente
      ? 'Trabajo aprobado por el comité. El rol Autor quedó habilitado automáticamente: usá el panel Autor.'
      : 'Trabajo aprobado por el comité académico. El organizador lo programará en mesa temática o sesión de pósters.';
  }
  if (t.estado === 'PROGRAMADO') {
    return 'Tu trabajo fue incluido en el cronograma del congreso. Consultá "Mis presentaciones programadas" en tu panel.';
  }
  if (t.estado === 'NOTIFICADO') {
    return 'Recibiste la notificación de presentación. Revisá fecha, sala y modalidad en tu panel.';
  }
  if (t.estado === 'PRECHECK_OK') {
    return 'Prevalidación aprobada. El comité asignará evaluadores.';
  }
  if (t.estado === 'RECHAZADO') {
    return 'Trabajo rechazado de forma definitiva.';
  }
  return '';
}
