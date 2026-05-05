/** Invitación a evaluar: pendiente de respuesta del evaluador */
export function isAssignmentInvitePending(a: { inviteStatus?: string } | null | undefined): boolean {
  return a?.inviteStatus === 'pending';
}

export function isAssignmentDeclined(a: { inviteStatus?: string } | null | undefined): boolean {
  return a?.inviteStatus === 'declined';
}

export function isAssignmentEvaluationDone(a: { status?: string } | null | undefined): boolean {
  return a?.status === 'done';
}

/**
 * Cupo que sigue contando para el circuito (no rechazó la asignación y no cerró evaluación).
 * Datos viejos sin `inviteStatus` cuentan como ya aceptados.
 */
export function isActiveAssignmentSlot(a: any): boolean {
  if (!a?.evaluatorId) return false;
  if (isAssignmentDeclined(a)) return false;
  if (isAssignmentEvaluationDone(a)) return false;
  return true;
}

/** El evaluador puede aceptar o rechazar la convocatoria */
export function canRespondToAssignmentInvite(a: any, evaluatorId: string): boolean {
  if (a?.evaluatorId !== evaluatorId) return false;
  if (isAssignmentDeclined(a)) return false;
  if (isAssignmentEvaluationDone(a)) return false;
  return isAssignmentInvitePending(a);
}

/** Puede cargar dictamen (aprobado/rechazo de evaluación) */
export function canEvaluatorSubmitReview(a: any, evaluatorId: string): boolean {
  if (a?.evaluatorId !== evaluatorId) return false;
  if (!isActiveAssignmentSlot(a)) return false;
  if (isAssignmentInvitePending(a)) return false;
  return true;
}

/** Todas las invitaciones activas ya fueron aceptadas (o son legado sin pending) */
export function allActiveInvitesAccepted(assignments: any[]): boolean {
  const active = (assignments || []).filter(isActiveAssignmentSlot);
  if (active.length === 0) return false;
  return active.every((a) => !isAssignmentInvitePending(a));
}
