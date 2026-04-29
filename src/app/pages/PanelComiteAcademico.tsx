import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, Users, CheckCircle, XCircle, UserPlus } from 'lucide-react';

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

export function PanelComiteAcademico() {
  const { user, sendNotificationToUser } = useAuth();
  const navigate = useNavigate();

  const [works, setWorks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [userFeedback, setUserFeedback] = useState<string>('');
  const [axisDraftByUserId, setAxisDraftByUserId] = useState<Record<string, string>>({});

  const [selectedWorkId, setSelectedWorkId] = useState<string>('');
  const selectedWork = useMemo(
    () => works.find((w) => w.id === selectedWorkId) || null,
    [works, selectedWorkId]
  );

  const [checks, setChecks] = useState<PrecheckChecks>(defaultChecks);
  const [notes, setNotes] = useState<string>('');
  const [assignedEvaluatorIds, setAssignedEvaluatorIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    if (user.currentRole !== 'comite') {
      navigate('/');
      return;
    }
    const storedWorks = JSON.parse(localStorage.getItem(WORKS_KEY) || '[]');
    const storedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    setWorks(storedWorks);
    setUsers(storedUsers);
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
      .map((a: any) => a?.evaluatorId)
      .filter(Boolean);
    setAssignedEvaluatorIds(prevAssign);
  }, [selectedWorkId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

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
    return evaluators
      .filter((ev: any) => Array.isArray(ev.axes) && ev.axes.includes(axis))
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
    // Regla: máximo 2 evaluadores por eje temático.
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
      return (counts.get(ax) || 0) < 2;
    });

    const removed = normalized.filter((ax) => !allowed.includes(ax));
    const nextAxes = allowed.slice(0, 1);
    const next = all.map((u: any) => (u.id === userId ? { ...u, axes: nextAxes } : u));
    persistUsers(next);
    setUserFeedback(
      removed.length > 0
        ? `Ejes actualizados. No se asignaron estos ejes porque ya tienen 2 evaluadores: ${removed.join(', ')}.`
        : 'Ejes del evaluador actualizados.'
    );
  };

  const makeEvaluatorWithAxis = (userId: string) => {
    setUserFeedback('');
    const axis = (axisDraftByUserId[userId] || '').trim();
    if (!axis) {
      setUserFeedback('Elegí un eje temático antes de hacer evaluador.');
      return;
    }
    // aplica regla de máximo 2 por eje
    if ((axisToEvaluatorIds.get(axis)?.size || 0) >= 2) {
      setUserFeedback('Ese eje ya tiene 2 evaluadores. Elegí otro eje.');
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

  const handlePrecheckOk = () => {
    setError('');
    if (!selectedWork) return;
    if (!isPrecheckOk) {
      setError('Para marcar como apto, completá todos los criterios del precheck.');
      return;
    }

    const precheck = {
      byAdminId: user.id,
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
  };

  const handlePrecheckFail = () => {
    setError('');
    if (!selectedWork) return;
    const precheck = {
      byAdminId: user.id,
      at: new Date().toISOString(),
      checks: { ...checks },
      notes: notes.trim() || '',
      result: 'failed' as const,
    };

    const attempts = (selectedWork.attempts || 1) + 1;
    updateWork(selectedWork.id, { precheck, status: 'prechecked_failed', attempts });
    sendNotificationToUser(
      selectedWork.userId,
      'Trabajo observado (prevalidación)',
      notes.trim()
        ? `Tu trabajo "${selectedWork.title}" no pasó la validación formal. Observaciones: ${notes.trim()}`
        : `Tu trabajo "${selectedWork.title}" no pasó la validación formal. Revisá las normas y reenviá.`,
      'Comité Académico'
    );
  };

  const handleAssignEvaluators = () => {
    setError('');
    if (!selectedWork) return;

    const status = getWorkStatus(selectedWork);
    if (status !== 'prechecked_ok' && status !== 'assigned' && status !== 'under_review') {
      setError('Primero marcá el trabajo como apto (precheck OK) antes de asignarlo a evaluación.');
      return;
    }

    const axis = getWorkAxis(selectedWork);
    if (!axis) {
      setError('El trabajo no tiene eje temático.');
      return;
    }

    const unique = Array.from(new Set(assignedEvaluatorIds.filter(Boolean)));
    if (unique.length < 2) {
      setError('Seleccioná 2 evaluadores para asignar el trabajo.');
      return;
    }

    // Validación: los evaluadores seleccionados deben pertenecer al eje del trabajo
    const evaluatorById = new Map<string, any>(evaluators.map((e: any) => [e.id, e]));
    const invalid = unique.filter((id) => {
      const ev = evaluatorById.get(id);
      return !(Array.isArray(ev?.axes) && ev.axes.includes(axis));
    });
    if (invalid.length > 0) {
      setError('Los evaluadores seleccionados no están especializados en el eje del trabajo. Configuralos en “Evaluadores por eje”.');
      return;
    }

    // Evitamos duplicar asignaciones ya hechas
    const existing = getWorkAssignments(selectedWork);
    const existingIds = new Set(existing.map((a: any) => a?.evaluatorId).filter(Boolean));

    const now = new Date().toISOString();
    const add = unique
      .filter((id) => !existingIds.has(id))
      .map((evaluatorId) => ({
        evaluatorId,
        axis,
        assignedAt: now,
        status: 'assigned' as const,
      }));

    const nextAssignments = [...existing, ...add];
    const nextStatus = nextAssignments.length >= 2 ? 'assigned' : status;
    updateWork(selectedWork.id, { assignments: nextAssignments, status: nextStatus });

    unique.forEach((evaluatorId) => {
      sendNotificationToUser(
        evaluatorId,
        'Nuevo trabajo asignado',
        `Se te asignó el trabajo "${selectedWork.title}" (eje: ${axis}).`,
        'Comité Académico'
      );
    });
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

  const statusBadge = (st: string) => {
    const base = 'px-2 py-0.5 rounded-full text-xs font-medium';
    if (st === 'submitted') return <span className={`${base} bg-amber-100 text-amber-800`}>Enviado</span>;
    if (st === 'prechecked_ok') return <span className={`${base} bg-blue-100 text-blue-800`}>Precheck OK</span>;
    if (st === 'prechecked_failed') return <span className={`${base} bg-red-100 text-red-800`}>Observado</span>;
    if (st === 'assigned') return <span className={`${base} bg-indigo-100 text-indigo-800`}>Asignado</span>;
    if (st === 'under_review') return <span className={`${base} bg-purple-100 text-purple-800`}>En revisión</span>;
    if (st === 'approved') return <span className={`${base} bg-green-100 text-green-800`}>Aprobado</span>;
    if (st === 'rejected') return <span className={`${base} bg-gray-100 text-gray-800`}>No aprobado</span>;
    return <span className={`${base} bg-gray-100 text-gray-700`}>{st}</span>;
  };

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
                        <div className="mt-2 text-[11px] text-gray-500">
                          Regla: máximo 2 evaluadores por eje. Este evaluador queda asociado a 1 eje.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
                          <div className="text-xs text-gray-400 mt-1">
                            Asignaciones: {a.length} • Reviews: {rev.length} (✓ {approvalsCount(rev)} / ✗ {rejectsCount(rev)})
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
                  </div>
                  <div className="shrink-0">{statusBadge(getWorkStatus(selectedWork))}</div>
                </div>

                {error && (
                  <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                  </div>
                )}

                {/* Precheck */}
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                    <div className="font-medium text-gray-900">Prevalidación formal (checklist)</div>
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
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                    >
                      Marcar apto (precheck OK)
                    </button>
                    <button
                      type="button"
                      onClick={handlePrecheckFail}
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
                        Seleccioná <span className="font-medium">2 evaluadores</span> del eje.
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
                              No hay suficientes evaluadores configurados para este eje (mínimo 2).
                              <div className="mt-1 text-[11px] text-amber-800">
                                Primero asigná evaluadores a este eje en “Evaluadores por eje temático”.
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
                                      disabled={disabled}
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

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      type="button"
                      onClick={handleAssignEvaluators}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition text-sm flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Asignar evaluadores
                    </button>
                    <button
                      type="button"
                      onClick={handleAssignThirdEvaluator}
                      className="px-4 py-2 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Asignar 3er evaluador (solo empate)
                    </button>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Nota: un trabajo se considera <span className="font-medium">Aprobado</span> cuando tiene 2 evaluaciones “approve”.
                    Si queda 1/1, el comité asigna un tercer evaluador.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

