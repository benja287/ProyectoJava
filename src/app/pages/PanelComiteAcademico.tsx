import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, Users, CheckCircle, XCircle, UserPlus, FileDown } from 'lucide-react';
import { deleteBrowserFile, openOrDownloadFile } from '../lib/browserFiles';
import { sendTransactionalEmail } from '../lib/emailSender';
import {
  isActiveAssignmentSlot,
  isAssignmentDeclined,
  isAssignmentEvaluationDone,
  isAssignmentInvitePending,
} from '../lib/workAssignments';

type PrecheckChecks = {
  pdfOk: boolean;
  pagesOk: boolean;
  structureOk: boolean;
  anonymousOk: boolean;
  classificationOk: boolean;
  pertinenceOk: boolean;
  formCompleteOk: boolean;
};

const defaultChecks: PrecheckChecks = {
  pdfOk: false,
  pagesOk: false,
  structureOk: false,
  anonymousOk: false,
  classificationOk: false,
  pertinenceOk: false,
  formCompleteOk: false,
};

const WORKS_KEY = 'congress_works';
const USERS_KEY = 'congress_users';
const EMAIL_LOG_KEY = 'congress_email_log';
const INSCRIPTION_CATEGORIES = [
  { value: 'socio_saae', label: 'Socio/a SAAE' },
  { value: 'no_socio', label: 'No socio/a' },
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'productor', label: 'Productor/a' },
  { value: 'investigador', label: 'Investigador/a' },
  { value: 'extensionista', label: 'Extensionista' },
  { value: 'docente', label: 'Docente' },
  { value: 'extranjero', label: 'Extranjero/a' },
] as const;

const MAX_EVALUATORS_PER_AXIS = 3;

function categoryLabel(category?: string): string {
  if (!category) return 'Sin categoría';
  const found = INSCRIPTION_CATEGORIES.find((c) => c.value === category);
  return found?.label || category;
}

function toBool(v: any): boolean {
  return v === true;
}

function getWorkAxis(work: any): string {
  return (work?.axis || '').trim();
}

function getWorkStatus(work: any): string {
  const st = work?.status || 'submitted';
  // compatibilidad con datos viejos: antes se usaba `pending` como “en evaluación”
  // ahora el flujo del comité arranca en `submitted`
  if (st === 'pending') return 'submitted';
  return st;
}

function getWorkReviews(work: any): any[] {
  return Array.isArray(work?.reviews) ? work.reviews : [];
}

function getWorkAssignments(work: any): any[] {
  return Array.isArray(work?.assignments) ? work.assignments : [];
}

function approvalsCount(reviews: any[]): number {
  return reviews.filter((r) => r?.decision === 'approve').length;
}

function rejectsCount(reviews: any[]): number {
  return reviews.filter((r) => r?.decision === 'reject').length;
}

function getPrecheckAttempts(work: any): number {
  if (typeof work?.precheckAttempts === 'number') return work.precheckAttempts;
  if (typeof work?.attempts === 'number') return work.attempts;
  return 0;
}

function getReviewAttempts(work: any): number {
  if (typeof work?.reviewAttempts === 'number') return work.reviewAttempts;
  return 0;
}

export function PanelComiteAcademico() {
  const { user, sendNotificationToUser } = useAuth();
  const navigate = useNavigate();

  const [works, setWorks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [userFeedback, setUserFeedback] = useState<string>('');
  const [emailLog, setEmailLog] = useState<any[]>([]);
  const [axisDraftByUserId, setAxisDraftByUserId] = useState<Record<string, string>>({});

  const [selectedWorkId, setSelectedWorkId] = useState<string>('');
  const selectedWork = useMemo(
    () => works.find((w) => w.id === selectedWorkId) || null,
    [works, selectedWorkId]
  );
  const selectedWorkStatus = selectedWork ? getWorkStatus(selectedWork) : '';
  const selectedWorkAttempts = selectedWork ? getPrecheckAttempts(selectedWork) : 1;
  const isCommitteeFlowClosed = selectedWorkStatus === 'approved' || selectedWorkStatus === 'rejected_final';
  const isAwaitingCommitteeFinal = selectedWorkStatus === 'pending_committee_final';
  const isPrecheckFinalRejected = selectedWorkStatus === 'prechecked_final';
  const isObservedAttemptsExhausted =
    selectedWorkStatus === 'prechecked_final' || (selectedWorkStatus === 'prechecked_failed' && selectedWorkAttempts >= 3);
  const cannotMutatePrecheckOrAssign =
    isCommitteeFlowClosed || isAwaitingCommitteeFinal || isObservedAttemptsExhausted;

  const [checks, setChecks] = useState<PrecheckChecks>(defaultChecks);
  const [notes, setNotes] = useState<string>('');
  const [assignedEvaluatorIds, setAssignedEvaluatorIds] = useState<string[]>([]);
  const [committeeFinalNotes, setCommitteeFinalNotes] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.currentRole !== 'comite') {
      navigate('/');
      return;
    }
    const storedWorks = JSON.parse(localStorage.getItem(WORKS_KEY) || '[]');
    const storedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const storedEmailLog = JSON.parse(localStorage.getItem(EMAIL_LOG_KEY) || '[]');
    setWorks(storedWorks);
    setUsers(storedUsers);
    setEmailLog(storedEmailLog);
  }, [user, navigate]);

  useEffect(() => {
    // cada vez que cambiás el trabajo seleccionado, cargamos precheck previo (si existe)
    if (!selectedWork) return;
    const prev = selectedWork.precheck;
    if (prev?.checks) {
      const c = prev.checks;
      setChecks({
        pdfOk: toBool(c.pdfOk),
        pagesOk: toBool(c.pagesOk),
        structureOk: toBool(c.structureOk),
        anonymousOk: toBool(c.anonymousOk),
        classificationOk: toBool(c.classificationOk),
        pertinenceOk: toBool(c.pertinenceOk),
        formCompleteOk: toBool(c.formCompleteOk),
      });
      setNotes(prev.notes || '');
    } else {
      setChecks(defaultChecks);
      setNotes('');
    }
    const prevAssign = getWorkAssignments(selectedWork)
      .filter(isActiveAssignmentSlot)
      .map((a: any) => a?.evaluatorId)
      .filter(Boolean);
    setAssignedEvaluatorIds(prevAssign);
    setCommitteeFinalNotes('');
  }, [selectedWorkId]); // eslint-disable-line react-hooks/exhaustive-deps

  const thematicAxes = [
    'Diseño y manejo de sistemas productivos agroecológicos',
    'Formación y construcción de saberes agroecológicos',
    'Metodologías de análisis y diagnóstico',
    'Semillas, agrobiodiversidad y servicios ecosistémicos',
    'Salud, nutrición y agroecología',
    'Economía, valor agregado y comercialización',
    'Planificación y desarrollo territorial',
    'Pueblos indígenas, géneros y juventudes',
    'Políticas públicas, movimientos sociales e institucionalidades',
  ];

  const isPrecheckOk = Object.values(checks).every(Boolean);

  const evaluators = useMemo(() => {
    return users.filter((u: any) => Array.isArray(u.roles) && u.roles.includes('evaluador'));
  }, [users]);

  const axisToEvaluatorIds = useMemo(() => {
    const map = new Map<string, Set<string>>();
    evaluators.forEach((ev: any) => {
      const axes = Array.isArray(ev.axes) ? ev.axes : [];
      axes.forEach((ax: string) => {
        if (!map.has(ax)) map.set(ax, new Set<string>());
        map.get(ax)!.add(ev.id);
      });
    });
    return map;
  }, [evaluators]);

  const matchingEvaluators = useMemo(() => {
    const axis = selectedWork ? getWorkAxis(selectedWork) : '';
    if (!axis) return [];
    const workOwnerId = selectedWork?.userId ? String(selectedWork.userId) : '';
    return evaluators
      .filter((ev: any) => Array.isArray(ev.axes) && ev.axes.includes(axis))
      // Un evaluador no puede evaluar su propio trabajo (cuenta multirol).
      // Lo ocultamos para evitar selecciones inválidas.
      .filter((ev: any) => !workOwnerId || String(ev.id) !== workOwnerId)
      .sort((a: any, b: any) => `${a.lastName || ''} ${a.name || ''}`.localeCompare(`${b.lastName || ''} ${b.name || ''}`));
  }, [evaluators, selectedWork]);

  const visibleWorks = useMemo(() => {
    // “Entraron al circuito” = submitted / prechecked_ok / assigned / under_review / approved / rejected / prechecked_failed
    // Mostramos especialmente los que requieren acción del comité.
    return works
      .filter((w: any) => w && w.id)
      .sort((a: any, b: any) => Number(b.id) - Number(a.id));
  }, [works]);

  const persistWorks = (next: any[]) => {
    localStorage.setItem(WORKS_KEY, JSON.stringify(next));
    setWorks(next);
  };

  const persistUsers = (next: any[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(next));
    setUsers(next);
    // si el usuario logueado es uno de los editados, actualiza current_user para reflejar ejes/roles
    if (user?.id) {
      const current = JSON.parse(localStorage.getItem('current_user') || '{}');
      const updatedSelf = next.find((u: any) => u.id === current?.id);
      if (updatedSelf) localStorage.setItem('current_user', JSON.stringify({ ...current, ...updatedSelf }));
    }
  };

  const makeEvaluator = (userId: string) => {
    setUserFeedback('');
    const all = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const next = all.map((u: any) => {
      if (u.id !== userId) return u;
      const roles = Array.isArray(u.roles) ? u.roles : [];
      if (roles.includes('evaluador')) return u;
      return { ...u, roles: [...roles, 'evaluador'] };
    });
    persistUsers(next);
    setUserFeedback('Se asignó el rol evaluador.');
  };

  // Nota: por requerimiento, cada evaluador queda asignado a 1 solo eje (array de 1).
  const setEvaluatorAxes = (userId: string, axes: string[]) => {
    setUserFeedback('');
    const all = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    // Regla: máximo 3 evaluadores por eje temático.
    const target = all.find((u: any) => u.id === userId);
    const prevAxes: string[] = Array.isArray(target?.axes) ? target.axes : [];

    // Conteo actual por eje (sin contar al usuario target, para poder “moverlo”)
    const counts = new Map<string, number>();
    all.forEach((u: any) => {
      if (!Array.isArray(u.roles) || !u.roles.includes('evaluador')) return;
      if (u.id === userId) return;
      (Array.isArray(u.axes) ? u.axes : []).forEach((ax: string) => {
        counts.set(ax, (counts.get(ax) || 0) + 1);
      });
    });

    const normalized = Array.from(new Set(axes));
    const allowed = normalized.filter((ax) => {
      // si ya lo tenía, lo puede mantener aunque el eje esté “lleno”
      if (prevAxes.includes(ax)) return true;
      return (counts.get(ax) || 0) < MAX_EVALUATORS_PER_AXIS;
    });

    const removed = normalized.filter((ax) => !allowed.includes(ax));
    const nextAxes = allowed.slice(0, 1);
    const next = all.map((u: any) => (u.id === userId ? { ...u, axes: nextAxes } : u));
    persistUsers(next);
    setUserFeedback(
      removed.length > 0
        ? `Ejes actualizados. No se asignaron estos ejes porque ya tienen ${MAX_EVALUATORS_PER_AXIS} evaluadores: ${removed.join(', ')}.`
        : 'Ejes del evaluador actualizados.'
    );
  };

  const clearEvaluatorAxis = (userId: string) => {
    setUserFeedback('');
    const all = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const next = all.map((u: any) => (u.id === userId ? { ...u, axes: [] } : u));
    persistUsers(next);
    setUserFeedback('Se quitó al evaluador de su eje temático. Ahora podés asignar ese cupo a otro usuario.');
  };

  const makeEvaluatorWithAxis = (userId: string) => {
    setUserFeedback('');
    const axis = (axisDraftByUserId[userId] || '').trim();
    if (!axis) {
      setUserFeedback('Elegí un eje temático antes de hacer evaluador.');
      return;
    }
    // aplica regla de máximo 3 por eje
    if ((axisToEvaluatorIds.get(axis)?.size || 0) >= MAX_EVALUATORS_PER_AXIS) {
      setUserFeedback(`Ese eje ya tiene ${MAX_EVALUATORS_PER_AXIS} evaluadores. Elegí otro eje.`);
      return;
    }
    makeEvaluator(userId);
    setEvaluatorAxes(userId, [axis]);
    setAxisDraftByUserId((p) => ({ ...p, [userId]: '' }));
  };

  const updateWork = (workId: string, patch: any) => {
    const all = JSON.parse(localStorage.getItem(WORKS_KEY) || '[]');
    const next = all.map((w: any) => (w.id === workId ? { ...w, ...patch } : w));
    persistWorks(next);
  };

  const logEmailToUser = (toEmail: string, subject: string, body: string, toName?: string) => {
    const outbox = JSON.parse(localStorage.getItem(EMAIL_LOG_KEY) || '[]');
    const emailRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      to: toEmail,
      toName: toName || '',
      subject,
      body,
      createdAt: new Date().toISOString(),
      from: 'comite@congreso.local',
      status: 'queued',
    };
    const nextOutbox = [emailRecord, ...outbox];
    localStorage.setItem(EMAIL_LOG_KEY, JSON.stringify(nextOutbox));
    setEmailLog(nextOutbox);

    void sendTransactionalEmail({
      toEmail,
      toName,
      subject,
      message: body,
    }).then((result) => {
      const latestOutbox = JSON.parse(localStorage.getItem(EMAIL_LOG_KEY) || '[]');
      const patched = latestOutbox.map((m: any) =>
        m.id === emailRecord.id
          ? {
              ...m,
              status: result.sent ? 'sent' : 'failed',
              error: result.reason || '',
            }
          : m
      );
      localStorage.setItem(EMAIL_LOG_KEY, JSON.stringify(patched));
      setEmailLog(patched);
    });
  };

  const getUserEmailById = (userId: string): string => {
    const u = users.find((usr: any) => usr.id === userId);
    return u?.email || '';
  };

  const notifyAuthorCommitteeFinal = (
    work: any,
    subject: string,
    bodyLines: string[]
  ) => {
    const authorEmail = getUserEmailById(work.userId);
    sendNotificationToUser(
      work.userId,
      subject,
      bodyLines.join('\n'),
      'Comité Académico'
    );
    if (authorEmail) {
      const body = `${bodyLines.join('\n')}\n\nComité Académico`;
      logEmailToUser(authorEmail, subject, body, work.userName);
    }
  };

  const handleCommitteeFinalAccept = () => {
    setError('');
    setUserFeedback('');
    if (!selectedWork) return;
    if (!isAwaitingCommitteeFinal) return;
    const now = new Date().toISOString();
    const notes = committeeFinalNotes.trim();
    const reviews = getWorkReviews(selectedWork);
    const reviewComments = reviews
      .filter((r: any) => typeof r?.comment === 'string' && r.comment.trim())
      .map((r: any, i: number) => `Eval ${i + 1}: ${r.comment.trim()}`);
    const reviewCommentsText = reviewComments.length ? reviewComments.join(' | ') : '';

    updateWork(selectedWork.id, {
      status: 'approved',
      committeeFinal: {
        decision: 'accepted' as const,
        byUserId: user?.id || '',
        decidedAt: now,
        notes: notes || undefined,
      },
    });

    const msgLines = [
      `Tu trabajo "${selectedWork.title}" fue aprobado por el Comité Académico (confirmación final tras las evaluaciones).`,
      ...(notes ? [`Observaciones del comité: ${notes}`] : []),
      ...(reviewCommentsText ? [`Comentarios de evaluadores: ${reviewCommentsText}`] : []),
      'Ingresá a la plataforma para ver el estado actualizado.',
    ];
    notifyAuthorCommitteeFinal(selectedWork, '[APROBADO] Confirmación final del Comité Académico', msgLines);
    setUserFeedback('Confirmación final registrada: trabajo aprobado.');
    setCommitteeFinalNotes('');
  };

  const handleCommitteeFinalReject = () => {
    setError('');
    setUserFeedback('');
    if (!selectedWork) return;
    if (!isAwaitingCommitteeFinal) return;
    const ok = window.confirm(
      '¿Confirmar que el Comité Académico rechaza definitivamente este trabajo? El autor verá el rechazo como final por comité (no por reenvío de evaluación).'
    );
    if (!ok) return;
    const now = new Date().toISOString();
    const notes = committeeFinalNotes.trim();
    if (!notes) {
      setError('Indicá el motivo del rechazo en el cuadro de observaciones (se enviará al autor).');
      return;
    }

    updateWork(selectedWork.id, {
      status: 'rejected_final',
      committeeFinal: {
        decision: 'rejected' as const,
        byUserId: user?.id || '',
        decidedAt: now,
        notes,
      },
    });

    notifyAuthorCommitteeFinal(selectedWork, '[RECHAZO FINAL] Decisión del Comité Académico', [
      `El Comité Académico rechazó definitivamente tu trabajo "${selectedWork.title}" tras las evaluaciones.`,
      `Motivo u observaciones: ${notes}`,
      'Podés consultar el estado en la plataforma.',
    ]);
    setUserFeedback('Confirmación final registrada: trabajo rechazado por el comité.');
    setCommitteeFinalNotes('');
  };

  const getEmailStatusText = (log: any): string => {
    if (log?.status === 'sent') return 'Enviado';
    if (log?.status === 'queued') return 'En cola';
    if (log?.error === 'email_not_configured') return 'Error: falta configurar EmailJS (.env)';
    if (typeof log?.error === 'string' && log.error.startsWith('email_api_error:')) {
      return 'Error: EmailJS rechazó la solicitud';
    }
    return 'Error';
  };

  const handlePrecheckOk = () => {
    setError('');
    if (!selectedWork) return;
    if (selectedWorkStatus === 'rejected') {
      setError('Este trabajo fue rechazado por evaluación y espera corrección/reenvío del autor.');
      return;
    }
    if (isCommitteeFlowClosed) {
      setError('Este trabajo ya tiene dictamen final. No se puede volver a prevalidar.');
      return;
    }
    if (isAwaitingCommitteeFinal) {
      setError('Este trabajo espera la confirmación final del comité; no se puede alterar la prevalidación.');
      return;
    }
    if (isPrecheckFinalRejected) {
      setError('Este trabajo quedó en No prevalidado final. No se puede cambiar su estado.');
      return;
    }
    if (isObservedAttemptsExhausted) {
      setError('Este trabajo agotó sus 3 intentos y quedó observado. No se puede cambiar su estado.');
      return;
    }
    if (!isPrecheckOk) {
      setError('Para marcar como apto, completá todos los criterios del precheck.');
      return;
    }

    const confirmed = window.confirm('¿Confirmás marcar este trabajo como APTO (precheck OK)?');
    if (!confirmed) return;

    const precheck = {
      byAdminId: user?.id || '',
      at: new Date().toISOString(),
      checks: { ...checks },
      notes: notes.trim() || '',
      result: 'ok' as const,
    };

    updateWork(selectedWork.id, { precheck, status: 'prechecked_ok' });
    sendNotificationToUser(
      selectedWork.userId,
      'Trabajo apto para evaluación',
      `Tu trabajo "${selectedWork.title}" pasó la validación formal y fue enviado a evaluación.`,
      'Comité Académico'
    );
    const authorEmail = getUserEmailById(selectedWork.userId);
    if (authorEmail) {
      const subject = '[PRECHECK OK] Trabajo apto para evaluación';
      const body =
        `Hola,\n\n` +
        `Tu trabajo "${selectedWork.title}" pasó la prevalidación formal del Comité Académico y fue enviado a evaluación.\n\n` +
        `Ingresá a la plataforma para ver el estado actualizado.\n\n` +
        `Comité Académico`;
      logEmailToUser(authorEmail, subject, body, selectedWork.userName);
    }
  };

  const handlePrecheckFail = () => {
    setError('');
    if (!selectedWork) return;
    if (selectedWorkStatus === 'rejected') {
      setError('Este trabajo fue rechazado por evaluación y espera corrección/reenvío del autor.');
      return;
    }
    if (isCommitteeFlowClosed) {
      setError('Este trabajo ya tiene dictamen final. No se puede volver a prevalidar.');
      return;
    }
    if (isAwaitingCommitteeFinal) {
      setError('Este trabajo espera la confirmación final del comité; no se puede alterar la prevalidación.');
      return;
    }
    if (isPrecheckFinalRejected) {
      setError('Este trabajo quedó en No prevalidado final. No se puede cambiar su estado.');
      return;
    }
    if (isObservedAttemptsExhausted) {
      setError('Este trabajo agotó sus 3 intentos y quedó observado. No se puede volver a observar ni cambiar su estado.');
      return;
    }

    const confirmed = window.confirm('¿Confirmás marcar este trabajo como OBSERVADO (precheck NO)?');
    if (!confirmed) return;

    const precheck = {
      byAdminId: user?.id || '',
      at: new Date().toISOString(),
      checks: { ...checks },
      notes: notes.trim() || '',
      result: 'failed' as const,
    };

    const nextPrecheckAttempts = selectedWorkAttempts + 1;
    const isFinalFail = nextPrecheckAttempts >= 3;
    updateWork(selectedWork.id, {
      precheck,
      precheckAttempts: nextPrecheckAttempts,
      attempts: nextPrecheckAttempts,
      status: isFinalFail ? 'prechecked_final' : 'prechecked_failed',
    });
    sendNotificationToUser(
      selectedWork.userId,
      isFinalFail ? 'Trabajo no prevalidado final' : 'Trabajo observado (prevalidación)',
      isFinalFail
        ? (notes.trim()
            ? `Tu trabajo "${selectedWork.title}" no pasó la validación formal en el intento ${nextPrecheckAttempts}/3. Observaciones: ${notes.trim()}. Ya no tenés más chances de reenvío.`
            : `Tu trabajo "${selectedWork.title}" no pasó la validación formal en el intento ${nextPrecheckAttempts}/3. Ya no tenés más chances de reenvío.`)
        : (notes.trim()
            ? `Tu trabajo "${selectedWork.title}" no pasó la validación formal. Observaciones: ${notes.trim()}`
            : `Tu trabajo "${selectedWork.title}" no pasó la validación formal. Revisá las normas y reenviá.`),
      'Comité Académico'
    );
    const authorEmail = getUserEmailById(selectedWork.userId);
    if (authorEmail) {
      const subject = isFinalFail
        ? '[NO PREVALIDADO FINAL] Resultado de prevalidación'
        : '[PRECHECK OBSERVADO] Observaciones de prevalidación';
      const body = notes.trim()
        ? `Hola,\n\nTu trabajo "${selectedWork.title}" no pasó la prevalidación.\nObservaciones: ${notes.trim()}\n\nEstado: ${isFinalFail ? 'No prevalidado final' : 'Observado (con posibilidad de reenvío)'}.\n\nComité Académico`
        : `Hola,\n\nTu trabajo "${selectedWork.title}" no pasó la prevalidación.\nEstado: ${isFinalFail ? 'No prevalidado final' : 'Observado (con posibilidad de reenvío)'}.\n\nComité Académico`;
      logEmailToUser(authorEmail, subject, body, selectedWork.userName);
    }
  };

  const handleAssignEvaluators = () => {
    setError('');
    setUserFeedback('');
    if (!selectedWork) return;

    const status = getWorkStatus(selectedWork);
    if (status === 'rejected') {
      setError('Este trabajo fue rechazado por evaluación y espera corrección/reenvío del autor.');
      return;
    }
    if (status === 'pending_committee_final') {
      setError('Este trabajo está pendiente de confirmación final del comité; no se modifican asignaciones hasta decidir.');
      return;
    }
    if (status === 'approved' || status === 'rejected_final') {
      setError('Este trabajo ya tiene dictamen final. No se puede reasignar a evaluación.');
      return;
    }
    if (status === 'prechecked_final') {
      setError('Este trabajo quedó en No prevalidado final. No se puede reasignar a evaluación.');
      return;
    }
    if (status === 'prechecked_failed' && getPrecheckAttempts(selectedWork) >= 3) {
      setError('Este trabajo quedó observado en el intento 3/3. No se puede reasignar a evaluación.');
      return;
    }
    if (status !== 'prechecked_ok' && status !== 'assigned' && status !== 'under_review') {
      setError('Primero marcá el trabajo como apto (precheck OK) antes de asignarlo a evaluación.');
      return;
    }

    const axis = getWorkAxis(selectedWork);
    if (!axis) {
      setError('El trabajo no tiene eje temático.');
      return;
    }

    const reviews = getWorkReviews(selectedWork);
    const tie = approvalsCount(reviews) === 1 && rejectsCount(reviews) === 1;
    const required = tie ? 3 : 2;

    const uniqueSelected = Array.from(new Set(assignedEvaluatorIds.filter(Boolean)));
    if (uniqueSelected.length < required) {
      setError(
        tie
          ? 'Seleccioná 3 evaluadores (empate 1/1: tercer evaluador).'
          : 'Seleccioná 2 evaluadores, o si uno rechazó la asignación mantené al que sigue y sumá al reemplazo.'
      );
      return;
    }
    if (!tie && uniqueSelected.length > 2) {
      setError('Seleccioná sólo 2 evaluadores (salvo empate 1/1 con tercer evaluador).');
      return;
    }
    if (tie && uniqueSelected.length > 3) {
      setError('En empate 1/1 podés seleccionar hasta 3 evaluadores.');
      return;
    }

    const evaluatorById = new Map<string, any>(evaluators.map((e: any) => [e.id, e]));
    const invalid = uniqueSelected.filter((id) => {
      const ev = evaluatorById.get(id);
      return !(Array.isArray(ev?.axes) && ev.axes.includes(axis));
    });
    if (invalid.length > 0) {
      setError('Los evaluadores seleccionados no están especializados en el eje del trabajo. Configuralos en “Evaluadores por eje”.');
      return;
    }

    const existing = getWorkAssignments(selectedWork);
    const activeSlots = existing.filter(isActiveAssignmentSlot);

    for (const a of activeSlots) {
      if (!uniqueSelected.includes(a.evaluatorId)) {
        setError(
          'No podés sacar de la selección a un evaluador con invitación pendiente o ya aceptada. Si rechazó la asignación, mantené al resto y sumá otro evaluador del eje hasta completar 2 cupos.'
        );
        return;
      }
    }

    const shouldAddEvaluatorSlot = (evaluatorId: string): boolean => {
      if (existing.some((a: any) => a.evaluatorId === evaluatorId && isActiveAssignmentSlot(a))) {
        return false;
      }
      if (tie && existing.some((a: any) => a.evaluatorId === evaluatorId && isAssignmentEvaluationDone(a))) {
        return false;
      }
      return true;
    };

    const now = new Date().toISOString();
    const add = uniqueSelected
      .filter((id) => shouldAddEvaluatorSlot(id))
      .map((evaluatorId) => ({
        evaluatorId,
        axis,
        assignedAt: now,
        status: 'assigned' as const,
        inviteStatus: 'pending' as const,
      }));

    if (add.length === 0) {
      setUserFeedback('No hay evaluadores nuevos para invitar: los cupos activos ya están cubiertos con la selección actual.');
      return;
    }

    const nextAssignments = [...existing, ...add];
    const activeAfter = nextAssignments.filter(isActiveAssignmentSlot);
    let nextStatus = status;
    if (activeAfter.length >= 2) {
      if (status === 'prechecked_ok') nextStatus = 'assigned';
    }
    updateWork(selectedWork.id, { assignments: nextAssignments, status: nextStatus });

    const evaluatorDataById = new Map<string, any>(evaluators.map((e: any) => [e.id, e]));
    const emailedTo: string[] = [];
    add.forEach((row) => {
      const evaluatorId = row.evaluatorId;
      const evaluator = evaluatorDataById.get(evaluatorId);
      sendNotificationToUser(
        evaluatorId,
        'Nuevo trabajo asignado',
        `Se te asignó el trabajo "${selectedWork.title}" (eje: ${axis}). Entrá al panel de evaluador y aceptá o rechazá la asignación.`,
        'Comité Académico'
      );

      if (evaluator?.email) {
        const subject = '[ASIGNADO A EVALUACIÓN] Nuevo trabajo — confirmá la asignación';
        const body =
          `Hola ${evaluator.name || ''},\n\n` +
          `Se te asignó un trabajo para evaluar.\n` +
          `Título: ${selectedWork.title}\n` +
          `Eje temático: ${axis}\n\n` +
          `Ingresá al panel de evaluador y elegí si aceptás o rechazás la asignación. Si la rechazás, el comité académico podrá invitar a otro evaluador.\n\n` +
          `Comité Académico`;
        logEmailToUser(evaluator.email, subject, body, `${evaluator.name || ''} ${evaluator.lastName || ''}`.trim());
        emailedTo.push(evaluator.email);
      }
    });

    if (emailedTo.length > 0) {
      setUserFeedback(`Invitación enviada (${add.length} evaluador/es). Email: ${emailedTo.join(', ')}`);
    } else {
      setUserFeedback(`Se registró la invitación a ${add.length} evaluador/es (sin email para aviso).`);
    }
  };

  const handleAssignThirdEvaluator = () => {
    setError('');
    if (!selectedWork) return;
    const reviews = getWorkReviews(selectedWork);
    if (!(approvalsCount(reviews) === 1 && rejectsCount(reviews) === 1)) {
      setError('Solo se asigna un 3er evaluador cuando hay empate (1 aprobación y 1 rechazo).');
      return;
    }
    handleAssignEvaluators();
  };

  const handleDeleteExhaustedWork = async () => {
    setError('');
    if (!selectedWork) return;
    const deletableFinal = isObservedAttemptsExhausted || selectedWorkStatus === 'rejected_final';
    if (!deletableFinal) {
      setError('Solo se pueden eliminar trabajos finalizados (No prevalidado final o Rechazado final).');
      return;
    }

    const confirmed = window.confirm(
      `Vas a eliminar el trabajo "${selectedWork.title}" de forma permanente. Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    if (selectedWork.fileId) {
      try {
        await deleteBrowserFile(selectedWork.fileId);
      } catch {
        // si falla la limpieza del archivo local, igual eliminamos el registro
      }
    }

    const all = JSON.parse(localStorage.getItem(WORKS_KEY) || '[]');
    const next = all.filter((w: any) => w.id !== selectedWork.id);
    persistWorks(next);
    setSelectedWorkId('');
  };

  const statusBadge = (st: string) => {
    const base = 'px-2 py-0.5 rounded-full text-xs font-medium';
    if (st === 'submitted') return <span className={`${base} bg-amber-100 text-amber-800`}>Enviado</span>;
    if (st === 'prechecked_ok') return <span className={`${base} bg-blue-100 text-blue-800`}>Precheck OK</span>;
    if (st === 'prechecked_failed') return <span className={`${base} bg-red-100 text-red-800`}>Observado</span>;
    if (st === 'prechecked_final') return <span className={`${base} bg-red-200 text-red-900`}>No prevalidado final</span>;
    if (st === 'assigned') return <span className={`${base} bg-indigo-100 text-indigo-800`}>Asignado</span>;
    if (st === 'under_review') return <span className={`${base} bg-purple-100 text-purple-800`}>En revisión</span>;
    if (st === 'pending_committee_final') {
      return <span className={`${base} bg-sky-100 text-sky-900`}>Pendiente confirmación comité</span>;
    }
    if (st === 'approved') return <span className={`${base} bg-green-100 text-green-800`}>Aprobado</span>;
    if (st === 'rejected') return <span className={`${base} bg-orange-100 text-orange-800`}>Rechazado (reenvío)</span>;
    if (st === 'rejected_final') return <span className={`${base} bg-gray-100 text-gray-800`}>Rechazado final</span>;
    return <span className={`${base} bg-gray-100 text-gray-700`}>{st}</span>;
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-6xl">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4">
            <ClipboardList className="w-12 h-12 text-indigo-600" />
            <div>
              <h1 className="text-3xl text-gray-800">Comité Académico</h1>
              <p className="text-gray-600">
                Prevalidación formal y asignación de trabajos a evaluadores por eje temático
              </p>
              <div className="mt-3 text-sm text-gray-700">
                <span className="font-medium">Pasos:</span>{' '}
                1) Seleccioná un trabajo → 2) completá el precheck (OK u observado) → 3) asigná 2 evaluadores del eje → 4) si hay empate 1/1, asigná un 3er evaluador.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Evaluadores por eje */}
          <div className="bg-white rounded-xl shadow p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-gray-800">Evaluadores por eje temático</h2>
              <span className="text-sm text-gray-500">
                Evaluadores: {evaluators.length}
              </span>
            </div>

            {userFeedback && (
              <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                {userFeedback}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map((u: any) => {
                const isEval = Array.isArray(u.roles) && u.roles.includes('evaluador');
                const currentAxis = (Array.isArray(u.axes) ? u.axes[0] : '') || '';
                return (
                  <div key={u.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{u.name} {u.lastName}</div>
                        <div className="text-xs text-gray-500 truncate">{u.email}</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(u.roles || []).map((r: string) => (
                            <span key={r} className="text-xs bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isEval ? (
                          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                            Evaluador
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full">
                            No evaluador
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-1">Categoría de inscripción</div>
                      <div className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-gray-50 text-gray-700">
                        {categoryLabel(u.category)}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs text-gray-500 mb-1">
                        {isEval ? 'Eje temático asignado' : 'Elegí eje temático para hacerlo evaluador'}
                      </div>

                      <select
                        value={isEval ? currentAxis : (axisDraftByUserId[u.id] || '')}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (isEval) {
                            setEvaluatorAxes(u.id, value ? [value] : []);
                          } else {
                            setAxisDraftByUserId((p) => ({ ...p, [u.id]: value }));
                          }
                        }}
                        className="w-full border border-gray-200 rounded-lg p-2 text-xs"
                      >
                        <option value="">{isEval ? '(sin eje)' : 'Seleccionar eje...'}</option>
                        {thematicAxes.map((ax) => (
                          <option
                            key={ax}
                            value={ax}
                            disabled={
                              !isEval &&
                              (axisToEvaluatorIds.get(ax)?.size || 0) >= 2
                            }
                          >
                            {ax}
                          </option>
                        ))}
                      </select>

                      {!isEval ? (
                        <button
                          type="button"
                          onClick={() => makeEvaluatorWithAxis(u.id)}
                          className="mt-3 w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 transition"
                        >
                          Hacer evaluador en este eje
                        </button>
                      ) : (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => clearEvaluatorAxis(u.id)}
                            className="w-full px-3 py-2 border border-red-200 text-red-700 rounded-lg text-xs hover:bg-red-50 transition"
                          >
                            Quitar del eje temático
                          </button>
                          <div className="mt-2 text-[11px] text-gray-500">
                            Regla: máximo {MAX_EVALUATORS_PER_AXIS} evaluadores por eje. Si quitás a uno del eje, liberás cupo para asignar otro.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl text-gray-800">Últimos emails enviados</h2>
              <span className="text-sm text-gray-500">{emailLog.length} total</span>
            </div>
            {emailLog.some((m: any) => m?.error === 'email_not_configured') && (
              <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Falta configurar EmailJS para que el correo salga de verdad. Cargá `VITE_EMAILJS_SERVICE_ID`,
                `VITE_EMAILJS_TEMPLATE_ID` y `VITE_EMAILJS_PUBLIC_KEY` en `.env` y reiniciá `npm run dev`.
              </div>
            )}
            {emailLog.length === 0 ? (
              <p className="text-sm text-gray-500">Todavía no se registraron emails.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-auto pr-1">
                {emailLog.slice(0, 10).map((m: any) => (
                  <div key={m.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString('es-AR')}</div>
                    <div className="text-sm text-gray-800 mt-1">Para: {m.to}</div>
                    <div className="text-sm text-gray-700">Asunto: {m.subject}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Estado: {getEmailStatusText(m)}
                    </div>
                    {m.status === 'failed' && m.error && m.error !== 'email_not_configured' && (
                      <div className="text-[11px] text-red-600 mt-1 break-all">
                        Detalle: {m.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lista */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-gray-800">Trabajos</h2>
              <span className="text-sm text-gray-500">{visibleWorks.length} total</span>
            </div>

            {visibleWorks.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700">
                No hay trabajos enviados todavía.
                <div className="mt-2 text-xs text-gray-500">
                  Para ver el flujo, ingresá con un usuario autor/asistente y enviá un trabajo en <span className="font-medium">“Enviar Trabajo”</span>.
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-auto pr-2">
                {visibleWorks.map((w: any) => {
                  const st = getWorkStatus(w);
                  const rev = getWorkReviews(w);
                  const a = getWorkAssignments(w);
                  const workUser = users.find((usr: any) => usr.id === w.userId);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWorkId(w.id)}
                      className={`w-full text-left border rounded-lg p-4 hover:bg-gray-50 transition ${
                        selectedWorkId === w.id ? 'border-indigo-400 bg-indigo-50/40' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{w.title}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">{w.axis || '—'}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {w.workType ? (w.workType === 'cientifico' ? 'Científico' : 'Relato de experiencia') : 'Tipo: —'} •{' '}
                            {(w.modality ?? w.type) ? `Modalidad: ${w.modality ?? w.type}` : 'Modalidad: —'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Categoría autor/a: {categoryLabel(workUser?.category)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Asignaciones: {a.length} • Reviews: {rev.length} (✓ {approvalsCount(rev)} / ✗ {rejectsCount(rev)})
                          </div>
                          <div className="mt-2">
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              Precheck {Math.min(getPrecheckAttempts(w), 3)}/3
                            </span>
                            <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-800 border border-violet-200">
                              Revisión {Math.min(getReviewAttempts(w), 2)}/2
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0">{statusBadge(st)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detalle */}
          <div className="bg-white rounded-xl shadow p-6">
            {!selectedWork ? (
              <div className="text-gray-500 text-sm">
                Seleccioná un trabajo para hacer precheck y asignar evaluadores.
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h2 className="text-xl text-gray-900 truncate">{selectedWork.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">{selectedWork.axis || '—'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Autor: {selectedWork.userName || selectedWork.userId}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Categoría autor/a: {categoryLabel(users.find((usr: any) => usr.id === selectedWork.userId)?.category)}
                    </p>
                  </div>
                  <div className="shrink-0">{statusBadge(getWorkStatus(selectedWork))}</div>
                </div>

                {error && (
                  <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                  </div>
                )}
                {isCommitteeFlowClosed && (
                  <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Este trabajo ya tiene dictamen final. La prevalidación y la asignación de evaluadores quedan bloqueadas.
                  </div>
                )}
                {isObservedAttemptsExhausted && (
                  <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Este trabajo quedó en No prevalidado final (3/3). Ya no admite nuevos cambios de prevalidación ni reasignación.
                  </div>
                )}
                {(isObservedAttemptsExhausted || selectedWorkStatus === 'rejected_final') && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={handleDeleteExhaustedWork}
                      className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition text-sm"
                    >
                      Eliminar trabajo finalizado
                    </button>
                  </div>
                )}

                {!isAwaitingCommitteeFinal && (
                <>
                {/* Precheck */}
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                    <div className="font-medium text-gray-900">Prevalidación formal (checklist)</div>
                  </div>
                  <div className="mb-3">
                    {selectedWork.fileId || selectedWork.filePdfBase64 ? (
                      <button
                        type="button"
                        onClick={() =>
                          openOrDownloadFile({
                            fileId: selectedWork.fileId,
                            fileName: selectedWork.fileName,
                            filePdfBase64: selectedWork.filePdfBase64,
                          })
                        }
                        className="flex items-center gap-2 text-sm text-teal-700 border border-teal-300 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition"
                      >
                        <FileDown className="w-4 h-4" />
                        Ver / descargar PDF enviado
                      </button>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Este trabajo no tiene PDF adjunto.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {([
                      ['pdfOk', 'PDF válido y legible'],
                      ['pagesOk', 'Hasta 5 páginas'],
                      ['structureOk', 'Estructura requerida'],
                      ['anonymousOk', 'Anonimato (doble ciego)'],
                      ['classificationOk', 'Clasificación correcta'],
                      ['pertinenceOk', 'Pertinencia temática'],
                      ['formCompleteOk', 'Formulario completo'],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 border border-gray-100 rounded px-3 py-2">
                        <input
                          type="checkbox"
                          checked={checks[key]}
                          disabled={cannotMutatePrecheckOrAssign}
                          onChange={(e) => setChecks({ ...checks, [key]: e.target.checked })}
                        />
                        <span className="text-gray-800">{label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs text-gray-500 mb-1">Observaciones (se envían al autor)</label>
                    <textarea
                      value={notes}
                      disabled={cannotMutatePrecheckOrAssign}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700"
                      placeholder="Ej: El PDF contiene nombres de autores / excede las 5 páginas / falta resumen, etc."
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      type="button"
                      onClick={handlePrecheckOk}
                      disabled={cannotMutatePrecheckOrAssign}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                    >
                      Marcar apto (precheck OK)
                    </button>
                    <button
                      type="button"
                      onClick={handlePrecheckFail}
                      disabled={cannotMutatePrecheckOrAssign}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      Observar (precheck NO)
                    </button>
                  </div>
                </div>

                {/* Asignación */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <div className="font-medium text-gray-900">Asignación a evaluadores</div>
                  </div>

                  <div className="text-xs text-gray-500 mb-2">
                    Eje temático del trabajo:
                    <span className="font-medium"> {selectedWork.axis || '—'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-2">
                        Seleccioná <span className="font-medium">2 evaluadores</span> del eje (el autor del trabajo no aparece en la lista).
                      </div>

                      {/* “Eje temático” como selector (solo informativo, bloqueado para que coincida con el trabajo) */}
                      <select
                        disabled
                        value={selectedWork.axis || ''}
                        className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-gray-50 text-gray-700 mb-3"
                      >
                        <option value="">(sin eje)</option>
                        {thematicAxes.map((ax) => (
                          <option key={ax} value={ax}>{ax}</option>
                        ))}
                      </select>

                      {(() => {
                        const reviews = getWorkReviews(selectedWork);
                        const tie = approvalsCount(reviews) === 1 && rejectsCount(reviews) === 1;
                        const maxPick = tie ? 3 : 2;
                        const axis = getWorkAxis(selectedWork);
                        const options = matchingEvaluators;

                        const toggle = (id: string) => {
                          setAssignedEvaluatorIds((prev) => {
                            const set = new Set(prev);
                            if (set.has(id)) {
                              set.delete(id);
                              return Array.from(set);
                            }
                            if (set.size >= maxPick) return prev;
                            set.add(id);
                            return Array.from(set);
                          });
                        };

                        if (!axis) {
                          return <div className="text-xs text-red-700">El trabajo no tiene eje temático.</div>;
                        }

                        if (options.length < 2) {
                          return (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                              No hay suficientes evaluadores configurados para este eje (mínimo 2 disponibles).
                              <div className="mt-1 text-[11px] text-amber-800">
                                Primero asigná evaluadores a este eje en “Evaluadores por eje temático” (máximo {MAX_EVALUATORS_PER_AXIS} por eje).
                              </div>
                            </div>
                          );
                        }

                        return (
                          <>
                            <div className="text-xs text-gray-500 mb-2">
                              Seleccionados: {assignedEvaluatorIds.length}/{maxPick}
                              {tie ? ' (empate 1/1: se permite 3er evaluador)' : ''}
                            </div>
                            <div className="space-y-2">
                              {options.map((ev: any) => {
                                const checked = assignedEvaluatorIds.includes(ev.id);
                                const disabled = !checked && assignedEvaluatorIds.length >= maxPick;
                                return (
                                  <label
                                    key={ev.id}
                                    className={`flex items-center justify-between gap-3 border rounded-lg px-3 py-2 text-sm ${
                                      checked ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-200'
                                    } ${disabled ? 'opacity-60' : ''}`}
                                  >
                                    <div className="min-w-0">
                                      <div className="text-gray-900 truncate">{ev.name} {ev.lastName}</div>
                                      <div className="text-[11px] text-gray-500 truncate">{ev.email}</div>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={disabled || cannotMutatePrecheckOrAssign}
                                      onChange={() => toggle(ev.id)}
                                    />
                                  </label>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="text-sm text-gray-700">
                      <div className="text-xs text-gray-500 mb-2">Ejes disponibles</div>
                      <div className="flex flex-wrap gap-2">
                        {thematicAxes.map((ax) => (
                          <span
                            key={ax}
                            className={`text-xs px-2 py-1 rounded border ${
                              ax === selectedWork.axis ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-white border-gray-200 text-gray-600'
                            }`}
                          >
                            {ax}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {getWorkAssignments(selectedWork).length > 0 && (
                    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
                      <div className="font-medium text-gray-800 mb-2">Estado por evaluador</div>
                      <ul className="space-y-1.5">
                        {getWorkAssignments(selectedWork).map((a: any, i: number) => {
                          const ev = users.find((u: any) => u.id === a.evaluatorId);
                          const name = ev ? `${ev.name} ${ev.lastName}` : a.evaluatorId;
                          let label = '—';
                          if (a.inviteStatus === 'declined') {
                            label = 'Rechazó la asignación — sumá otro evaluador del eje y volvé a “Asignar evaluadores”.';
                          } else if (a.inviteStatus === 'pending') {
                            label = 'Invitación pendiente (debe aceptar o rechazar en su panel).';
                          } else if (isAssignmentEvaluationDone(a)) {
                            label = 'Evaluación cargada.';
                          } else {
                            label = 'Asignación aceptada — pendiente de dictamen.';
                          }
                          return (
                            <li key={`${a.evaluatorId}-${i}`} className="text-gray-700">
                              <span className="font-medium text-gray-900">{name}</span>
                              <span className="text-gray-600"> — {label}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      type="button"
                      onClick={handleAssignEvaluators}
                      disabled={cannotMutatePrecheckOrAssign}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition text-sm flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Asignar evaluadores
                    </button>
                    <button
                      type="button"
                      onClick={handleAssignThirdEvaluator}
                      disabled={cannotMutatePrecheckOrAssign}
                      className="px-4 py-2 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Asignar 3er evaluador (solo empate)
                    </button>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Cada evaluador debe <span className="font-medium">aceptar la asignación</span> en su panel antes de cargar el dictamen.
                    Si rechaza, mantené al otro evaluador en la lista, sumá un reemplazo del mismo eje y pulsá otra vez “Asignar evaluadores”.
                    Con 2 evaluaciones “approve” el trabajo pasa a <span className="font-medium">pendiente de confirmación final</span> del comité; recién ahí queda
                    <span className="font-medium"> Aprobado</span> al congreso. Si queda empate 1/1 en evaluación, asigná un tercer evaluador.
                  </div>

                  {getWorkReviews(selectedWork).length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <div className="text-xs font-medium text-gray-700 mb-2">Devoluciones de evaluadores</div>
                      <div className="space-y-2">
                        {getWorkReviews(selectedWork).map((r: any, idx: number) => (
                          <div key={`${r?.evaluatorId || 'ev'}-${idx}`} className="text-xs border border-gray-200 rounded p-2">
                            <div className="text-gray-700">
                              Dictamen: <span className="font-medium">{r?.decision === 'approve' ? 'Aprobar' : 'Rechazar'}</span>
                            </div>
                            {r?.comment ? (
                              <div className="text-gray-600 mt-1">Comentario: {r.comment}</div>
                            ) : (
                              <div className="text-gray-400 mt-1 italic">Sin comentario del evaluador.</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                </>
                )}

                {isAwaitingCommitteeFinal && (
                  <>
                    <div className="mb-6 rounded-xl border-2 border-sky-400 bg-gradient-to-br from-sky-50 to-white p-6 shadow-md">
                      <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Confirmación final del comité</h3>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        Los evaluadores recomendaron aprobar. Registrá observaciones opcionales para el autor al confirmar la aceptación; si rechazás de forma
                        definitiva, el motivo es obligatorio.
                      </p>
                      <p className="text-xs text-sky-900/80 mt-2 rounded-md bg-sky-100/80 border border-sky-200 px-3 py-2">
                        En esta etapa ya no corresponde prevalidación ni nuevas asignaciones de evaluadores: solo la decisión formal del comité académico.
                      </p>

                      <div className="mt-4 mb-5">
                        {selectedWork.fileId || selectedWork.filePdfBase64 ? (
                          <button
                            type="button"
                            onClick={() =>
                              openOrDownloadFile({
                                fileId: selectedWork.fileId,
                                fileName: selectedWork.fileName,
                                filePdfBase64: selectedWork.filePdfBase64,
                              })
                            }
                            className="inline-flex items-center gap-2 text-sm text-teal-700 border border-teal-300 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-lg transition"
                          >
                            <FileDown className="w-4 h-4" />
                            Ver / descargar PDF del trabajo
                          </button>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Sin PDF adjunto en el envío.</p>
                        )}
                      </div>

                      <label className="block text-sm font-medium text-gray-800 mb-1">Observaciones para el autor</label>
                      <p className="text-xs text-gray-500 mb-2">Opcional al aceptar; obligatorio al rechazar definitivo.</p>
                      <textarea
                        value={committeeFinalNotes}
                        onChange={(e) => setCommitteeFinalNotes(e.target.value)}
                        rows={4}
                        className="w-full border border-sky-200 rounded-lg p-3 text-sm text-gray-800 mb-4 shadow-sm"
                        placeholder="Opcional al aceptar; obligatorio al rechazar definitivo."
                      />
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleCommitteeFinalAccept}
                          className="px-5 py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition shadow-sm"
                        >
                          Confirmar aceptación al congreso
                        </button>
                        <button
                          type="button"
                          onClick={handleCommitteeFinalReject}
                          className="px-5 py-2.5 bg-red-800 text-white rounded-lg text-sm font-medium hover:bg-red-900 transition shadow-sm"
                        >
                          Rechazo definitivo por comité
                        </button>
                      </div>
                    </div>

                    {getWorkReviews(selectedWork).length > 0 && (
                      <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-5 mb-2">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Devoluciones de evaluadores</h4>
                        <div className="space-y-2">
                          {getWorkReviews(selectedWork).map((r: any, idx: number) => (
                            <div key={`${r?.evaluatorId || 'ev'}-${idx}`} className="text-sm border border-gray-200 rounded-lg p-3 bg-white">
                              <div className="text-gray-800">
                                Dictamen: <span className="font-medium">{r?.decision === 'approve' ? 'Aprobar' : 'Rechazar'}</span>
                              </div>
                              {r?.comment ? (
                                <div className="text-gray-600 mt-2 text-sm">Comentario: {r.comment}</div>
                              ) : (
                                <div className="text-gray-400 mt-2 text-sm italic">Sin comentario del evaluador.</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
          <div className="mt-6">
            <fieldset>
              <button
                type="button"
                onClick={() => navigate("/certificado")}
                className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 transition"
              >
                Generar Certificado
              </button>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
}

