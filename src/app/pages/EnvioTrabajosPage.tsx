import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { CheckCircle } from 'lucide-react';
import { saveBrowserFile, deleteBrowserFile } from '../lib/browserFiles';

export function EnvioTrabajosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState('');
  const [uploading, setUploading] = useState(false);

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
  ] as const;

  const [formData, setFormData] = useState({
    title: '',
    workType: '',
    modality: '',
    axis:  '',
    file:  null as File | null,
  });
  const [selectedResubmitWorkId, setSelectedResubmitWorkId] = useState<string>('');

  const [myWorks, setMyWorks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    setMyWorks(allWorks.filter((w: any) => w.userId === user.id));
  }, [user, navigate]);

  if (!user) return null;

  // ── Validaciones de rol ────────────────────────────────────────────────────
  const isAutor = user.currentRole === 'autor';
  const isAsistente = user.currentRole === 'asistente';
  /** Si la cuenta tiene ambos roles, los trabajos solo se envían con rol autor activo (no desde el flujo “asistente”). */
  const cuentaTieneAutor = user.roles?.includes('autor');
  const cuentaTieneAsistente = user.roles?.includes('asistente');
  const bloqueadoPorDobleRol =
    isAsistente && cuentaTieneAutor && cuentaTieneAsistente;

  const inferSubmissionRole = (work: any): 'asistente' | 'autor' => {
    if (work?.submittedByRole === 'autor') return 'autor';
    if (work?.submittedByRole === 'asistente') return 'asistente';
    // compatibilidad con trabajos viejos sin submittedByRole
    if (cuentaTieneAutor && cuentaTieneAsistente) return 'autor';
    if (cuentaTieneAutor) return 'autor';
    return 'asistente';
  };

  const currentRoleWorks = myWorks.filter((w) =>
    (isAutor && inferSubmissionRole(w) === 'autor') ||
    (isAsistente && inferSubmissionRole(w) === 'asistente')
  );

  const getPrecheckAttempts = (w: any) => {
    if (typeof w?.precheckAttempts === 'number') return w.precheckAttempts;
    if (typeof w?.attempts === 'number') return w.attempts;
    return 0;
  };
  const getReviewAttempts = (w: any) => {
    if (typeof w?.reviewAttempts === 'number') return w.reviewAttempts;
    return 0;
  };

  const activeWorks          = currentRoleWorks.filter((w) => !['rejected', 'rejected_final', 'prechecked_failed', 'prechecked_final'].includes(w.status));
  const precheckResubmissions = currentRoleWorks.filter(
    (w) => w.status === 'prechecked_failed' && getPrecheckAttempts(w) < 3
  );
  const reviewResubmissions = currentRoleWorks.filter(
    (w) => w.status === 'rejected' && getReviewAttempts(w) < 2
  );
  const availableResubmissions = [...precheckResubmissions, ...reviewResubmissions];
  const workToResubmit = availableResubmissions.find((w) => w.id === selectedResubmitWorkId) || availableResubmissions[0] || null;
  const exhaustedPrecheckWorks = currentRoleWorks.filter(
    (w) => (w.status === 'prechecked_failed' && getPrecheckAttempts(w) >= 3) || w.status === 'prechecked_final'
  );
  const exhaustedReviewWorks = currentRoleWorks.filter(
    (w) => w.status === 'rejected_final' || (w.status === 'rejected' && getReviewAttempts(w) >= 2)
  );
  const worksUnderReview = currentRoleWorks.filter(
    (w) => w.status === 'under_review' || w.status === 'pending_committee_final'
  );
  const authorLimit = cuentaTieneAutor && cuentaTieneAsistente ? 1 : 2;

  useEffect(() => {
    if (!workToResubmit) {
      setSelectedResubmitWorkId('');
      return;
    }
    if (!selectedResubmitWorkId) {
      setSelectedResubmitWorkId(workToResubmit.id);
    }
  }, [workToResubmit, selectedResubmitWorkId]);

  useEffect(() => {
    if (!workToResubmit) return;
    setFormData({
      title: workToResubmit.title || '',
      workType: workToResubmit.workType || '',
      modality: workToResubmit.modality ?? workToResubmit.type ?? '',
      axis: workToResubmit.axis || '',
      file: null,
    });
  }, [workToResubmit?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit = () => {
    if (!isAutor && !isAsistente) return false;
    if (bloqueadoPorDobleRol) return false;
    if (availableResubmissions.length > 0) return true;
    if (isAutor) return activeWorks.length < authorLimit;
    // Solo asistente (sin rol autor en la cuenta): 1 trabajo
    if (isAsistente && !cuentaTieneAutor) return activeWorks.length < 1;
    return false;
  };

  const submissionBlockedReason = (() => {
    if (!isAutor && !isAsistente)
      return 'Necesitás ingresar con rol asistente o autor para enviar trabajos.';
    if (bloqueadoPorDobleRol) {
      return `Tu cuenta tiene rol autor y asistente. Cambiá a rol autor desde el menú de usuario y enviá tus trabajos desde el panel Autor (hasta ${authorLimit} trabajo${authorLimit > 1 ? 's' : ''} activo${authorLimit > 1 ? 's' : ''}).`;
    }
    if (availableResubmissions.length > 0) return '';
    if (worksUnderReview.length > 0) {
      return 'Tenés trabajo/s en revisión o pendientes de confirmación final del comité. En ese estado no podés usar el cupo para otro envío hasta que cambie el estado (por ejemplo, si queda rechazado con posibilidad de reenvío).';
    }
    if (exhaustedPrecheckWorks.length > 0 || exhaustedReviewWorks.length > 0) {
      if (isAutor) {
        return 'Como autor ya agotaste intentos en al menos un trabajo (precheck o evaluación). Ese trabajo no admite más reenvíos.';
      }
      return 'Como asistente ya agotaste intentos en al menos un trabajo (precheck o evaluación). Ese trabajo no admite más reenvíos.';
    }
    if (isAutor && activeWorks.length >= authorLimit)
      return `Como autor ya alcanzaste el máximo de ${authorLimit} trabajo${authorLimit > 1 ? 's' : ''} activo${authorLimit > 1 ? 's' : ''}.`;
    if (isAsistente && !cuentaTieneAutor && activeWorks.length >= 1)
      return 'Como asistente ya alcanzaste el máximo de 1 trabajo activo.';
    return '';
  })();

  const getStatusLabel = (status?: string) => {
    if (status === 'submitted') return 'Enviado';
    if (status === 'prechecked_ok') return 'Precheck OK';
    if (status === 'prechecked_failed') return 'Observado';
    if (status === 'prechecked_final') return 'No prevalidado final';
    if (status === 'assigned') return 'Asignado';
    if (status === 'under_review') return 'En revisión';
    if (status === 'pending_committee_final') return 'Pendiente confirmación del comité';
    if (status === 'approved') return 'Aprobado';
    if (status === 'rejected') return 'Rechazado (reenvío habilitado)';
    if (status === 'rejected_final') return 'Rechazado final';
    return status || 'Sin estado';
  };

  const getReviewComments = (work: any): string[] => {
    const reviews = Array.isArray(work?.reviews) ? work.reviews : [];
    return reviews
      .map((r: any) => (typeof r?.comment === 'string' ? r.comment.trim() : ''))
      .filter((c: string) => c.length > 0);
  };

  const getWorkFeedbackSummary = (work: any): { tone: 'ok' | 'warn' | 'error' | 'info'; text: string } => {
    const status = work?.status;
    const precheckNote = typeof work?.precheck?.notes === 'string' ? work.precheck.notes.trim() : '';
    const reviewComments = getReviewComments(work);

    if (status === 'prechecked_failed' || status === 'prechecked_final') {
      return {
        tone: 'error',
        text: precheckNote
          ? `${status === 'prechecked_final' ? 'No prevalidado final por Comité Académico' : 'Observación del Comité Académico'}: ${precheckNote}`
          : status === 'prechecked_final'
            ? 'No prevalidado final por Comité Académico. Se agotaron los intentos de prevalidación.'
            : 'El Comité Académico observó el trabajo en prevalidación formal. Revisá normas y reenviá si tenés intentos disponibles.',
      };
    }

    if (status === 'rejected' || status === 'rejected_final') {
      const com = work?.committeeFinal;
      const comRej =
        status === 'rejected_final' && com?.decision === 'rejected' && typeof com?.notes === 'string' && com.notes.trim()
          ? ` Motivo del Comité Académico: ${com.notes.trim()}`
          : '';
      return {
        tone: 'error',
        text: status === 'rejected_final'
          ? (reviewComments.length > 0
              ? `Rechazado final: ${reviewComments.join(' | ')}.${comRej}`
              : `Rechazado final.${comRej || ' No se registraron comentarios detallados de evaluadores.'}`)
          : (reviewComments.length > 0
              ? `Rechazado por evaluación (podés reenviar): ${reviewComments.join(' | ')}`
              : 'Rechazado por evaluación (podés reenviar). No se registraron comentarios detallados de evaluadores.'),
      };
    }

    if (status === 'approved') {
      return {
        tone: 'ok',
        text: reviewComments.length > 0
          ? `Aprobado por el Comité Académico (confirmación final). Comentarios de evaluadores: ${reviewComments.join(' | ')}`
          : 'Aprobado por el Comité Académico (confirmación final).',
      };
    }

    if (status === 'pending_committee_final') {
      return {
        tone: 'warn',
        text:
          reviewComments.length > 0
            ? `Evaluaciones favorables; falta la confirmación final del Comité Académico. Comentarios: ${reviewComments.join(' | ')}`
            : 'Evaluaciones favorables; falta la confirmación final del Comité Académico.',
      };
    }

    if (status === 'under_review') {
      return {
        tone: 'warn',
        text: reviewComments.length > 0
          ? `En revisión. Comentarios registrados hasta ahora: ${reviewComments.join(' | ')}`
          : 'En revisión por evaluadores. Aún no hay dictamen final.',
      };
    }

    if (status === 'prechecked_ok') {
      return {
        tone: 'info',
        text: 'Prevalidación formal aprobada por Comité Académico. Pendiente de evaluación.',
      };
    }

    return {
      tone: 'info',
      text: 'Trabajo enviado. Esperando prevalidación del Comité Académico.',
    };
  };

  const sortedCurrentRoleWorks = [...currentRoleWorks].sort((a: any, b: any) => Number(b.id) - Number(a.id));
  const otherRoleWorks = myWorks.filter((w: any) => !currentRoleWorks.some((cw: any) => cw.id === w.id));
  const sortedOtherRoleWorks = [...otherRoleWorks].sort((a: any, b: any) => Number(b.id) - Number(a.id));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (bloqueadoPorDobleRol) {
      setError(
        'Con rol asistente activo no podés enviar trabajos porque tu cuenta también es autora. Cambiá a rol autor y volvé a intentar.'
      );
      return;
    }
    if (availableResubmissions.length > 0 && !workToResubmit) {
      setError('Seleccioná qué trabajo querés corregir y reenviar.');
      return;
    }
    if (!canSubmit()) { setError('No podés enviar más trabajos según tu rol.'); return; }
    if (!formData.file) { setError('Debés adjuntar un archivo PDF.'); return; }
    if (formData.file.type !== 'application/pdf') { setError('El archivo debe ser un PDF válido.'); return; }
    if (!formData.workType) { setError('Debés seleccionar el tipo de trabajo: Científico o Relato de experiencia.'); return; }
    if (!formData.modality) { setError('Debés seleccionar la modalidad: Oral o Póster.'); return; }
    if (!formData.axis) { setError('Debés seleccionar un eje temático.'); return; }

    setUploading(true);

    // ── Guardar archivo en IndexedDB (NO en localStorage) ──────────────────
    // Si IndexedDB falla, el trabajo igual se guarda sin archivo — no bloqueamos el envío
    let storedFile = null;
    try {
      storedFile = await saveBrowserFile(formData.file);
    } catch {
      console.warn('No se pudo guardar el archivo en IndexedDB');
    }

    const allWorks     = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const rejectedWork = workToResubmit;

    let updatedWorks;

    if (rejectedWork) {
      // Reenvío — eliminar archivo viejo de IndexedDB si existía
      if (rejectedWork.fileId) void deleteBrowserFile(rejectedWork.fileId);

      updatedWorks = allWorks.map((w: any) =>
        w.id === rejectedWork.id
          ? {
              ...w,
              title:    formData.title,
              axis:     formData.axis,
              workType: formData.workType,
              modality: formData.modality,
              // compatibilidad con datos viejos que usan `type` para modalidad
              type:     formData.modality,
              submittedByRole: w.submittedByRole || user.currentRole,
              status:   'submitted',
              precheckAttempts: getPrecheckAttempts(w),
              reviewAttempts: getReviewAttempts(w),
              // compat: attempts refleja contador de fallas de precheck
              attempts: getPrecheckAttempts(w),
              // reinicia el circuito de revisión sobre el mismo trabajo (sin duplicar registros)
              precheck: undefined,
              assignments: [],
              reviews: [],
              ...(storedFile ? {
                fileName: storedFile.fileName,
                fileId:   storedFile.fileId,
                fileType: storedFile.fileType,
                fileSize: storedFile.fileSize,
              } : {}),
            }
          : w
      );
    } else {
      // Trabajo nuevo
      const newWork: any = {
        id:       Date.now().toString(),
        userId:   user.id,
        userName: `${user.name} ${user.lastName}`,
        title:    formData.title,
        axis:     formData.axis,
        workType: formData.workType,
        modality: formData.modality,
        // compatibilidad con pantallas existentes que filtran por `type`
        type:     formData.modality,
        submittedByRole: user.currentRole,
        status:   'submitted',
        precheckAttempts: 0,
        reviewAttempts: 0,
        attempts: 0,
        fecha:    null,
        hora:     null,
        sala:     null,
      };
      if (storedFile) {
        newWork.fileName = storedFile.fileName;
        newWork.fileId   = storedFile.fileId;
        newWork.fileType = storedFile.fileType;
        newWork.fileSize = storedFile.fileSize;
      }
      updatedWorks = [...allWorks, newWork];
    }

    // Guardar en localStorage solo metadatos — el archivo ya está en IndexedDB
    try {
      localStorage.setItem('congress_works', JSON.stringify(updatedWorks));
    } catch (err) {
      if (storedFile) void deleteBrowserFile(storedFile.fileId);
      setError(
        err instanceof DOMException && err.name === 'QuotaExceededError'
          ? 'El almacenamiento está lleno. Liberá espacio del navegador e intentá de nuevo.'
          : 'No se pudo guardar el trabajo. Intentá de nuevo.'
      );
      setUploading(false);
      return;
    }

    setUploading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <CheckCircle className="w-16 h-16 text-[#2d5016] mx-auto mb-4" />
          <h2 className="text-2xl">Trabajo enviado</h2>
          <p className="text-gray-600">En evaluación</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg p-8">

          <h1 className="text-3xl mb-4">Envío de Trabajos</h1>
          <div className="mb-4 text-sm text-gray-600">
            Trabajos enviados ({isAutor ? 'autor' : 'asistente'}): {currentRoleWorks.length} | Total histórico: {myWorks.length}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
          )}

          {!canSubmit() ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-center">
              <p className="text-amber-900 font-medium">
                No podés enviar un nuevo trabajo en este momento.
              </p>
              {submissionBlockedReason && (
                <p className="text-sm text-amber-800 mt-2">{submissionBlockedReason}</p>
              )}
              <p className="text-xs text-amber-700 mt-3">
                Trabajos activos ({isAutor ? 'autor' : 'asistente'}): {activeWorks.length} | Reenvíos disponibles: {availableResubmissions.length}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {workToResubmit && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                  <p className="text-sm text-blue-900">
                    Estás corrigiendo y reenviando el trabajo:
                    <span className="font-medium"> {workToResubmit.title || 'Sin título'}</span>.
                  </p>
                  <p className="text-xs text-blue-800 mt-1">
                    Al enviar, se actualiza ese mismo trabajo (no se crea uno nuevo) y vuelve al circuito de prevalidación.
                  </p>
                  {availableResubmissions.length > 1 && (
                    <p className="text-xs text-blue-800 mt-1">
                      Podés cambiar de trabajo desde los botones "Editar y reenviar" en la lista de abajo.
                    </p>
                  )}
                </div>
              )}

              <input
                type="text"
                placeholder="Título"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border p-2 rounded"
              />

              <select
                required
                value={formData.workType}
                onChange={(e) => setFormData({ ...formData, workType: e.target.value })}
                className="w-full border p-2 rounded"
              >
                <option value="">Tipo de trabajo</option>
                <option value="cientifico">Científico</option>
                <option value="experiencia">Relato de experiencia</option>
              </select>

              <select
                required
                value={formData.modality}
                onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                className="w-full border p-2 rounded"
              >
                <option value="">Modalidad de presentación</option>
                <option value="oral">Oral</option>
                <option value="poster">Póster</option>
              </select>

              <select
                required
                value={formData.axis}
                onChange={(e) => setFormData({ ...formData, axis: e.target.value })}
                className="w-full border p-2 rounded"
              >
                <option value="">Eje temático</option>
                {thematicAxes.map((ax) => (
                  <option key={ax} value={ax}>{ax}</option>
                ))}
              </select>

              <div className="flex gap-6 hidden">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="oral"
                    checked={formData.modality === 'oral'}
                    onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                  />
                  Oral
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="poster"
                    checked={formData.modality === 'poster'}
                    onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                  />
                  Poster
                </label>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Adjunto (PDF obligatorio)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setError('');
                    setFormData({ ...formData, file });
                  }}
                  className="w-full text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  El archivo se guarda localmente en este navegador para su revisión.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="font-medium text-gray-800 mb-2">
                  Criterios para evaluar el documento (control formal)
                </div>
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  <li>Formato del archivo: PDF válido y legible.</li>
                  <li>Extensión permitida: hasta 5 páginas.</li>
                  <li>Cumplimiento de estructura: incluir apartados requeridos según el tipo de trabajo.</li>
                  <li>Anonimato: sin nombres, filiaciones ni datos identificatorios (doble ciego).</li>
                  <li>Clasificación correcta: tipo, modalidad y eje temático coherentes con el contenido.</li>
                  <li>Pertinencia temática: dentro del marco de la Agroecología y el eje elegido.</li>
                  <li>Completitud de datos: campos obligatorios del formulario correctamente completados.</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-[#2d5016] text-white py-2 rounded hover:bg-[#3d6b23] transition disabled:opacity-60"
              >
                {uploading ? 'Enviando...' : 'Enviar trabajo'}
              </button>

            </form>
          )}

          <div className="mt-8">
            <h2 className="text-lg text-gray-800 mb-3">Mis trabajos ({isAutor ? 'rol autor' : 'rol asistente'})</h2>
            {sortedCurrentRoleWorks.length === 0 ? (
              <p className="text-sm text-gray-500">Todavía no enviaste trabajos.</p>
            ) : (
              <div className="space-y-2">
                {sortedCurrentRoleWorks.map((work: any) => (
                  <div key={work.id} className="border border-gray-200 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-800 truncate">{work.title || 'Sin título'}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                          Enviado como {inferSubmissionRole(work)}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                          {getStatusLabel(work.status)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span>{work.axis || 'Sin eje'}</span>
                      <span>•</span>
                      <span>Precheck {Math.min(getPrecheckAttempts(work), 3)}/3</span>
                      <span>•</span>
                      <span>Revisión {Math.min(getReviewAttempts(work), 2)}/2</span>
                    </div>
                    {(() => {
                      const feedback = getWorkFeedbackSummary(work);
                      const colorClass =
                        feedback.tone === 'error'
                          ? 'text-red-700'
                          : feedback.tone === 'ok'
                            ? 'text-emerald-700'
                            : feedback.tone === 'warn'
                              ? 'text-amber-700'
                              : 'text-blue-700';
                      return (
                        <p className={`mt-1 text-[11px] ${colorClass}`}>
                          {feedback.text}
                        </p>
                      );
                    })()}
                    {work.status === 'rejected' && getReviewAttempts(work) < 2 && (
                      <p className="mt-1 text-[11px] text-emerald-700">
                        Podés corregir y reenviar. Volverá al comité para nueva prevalidación.
                      </p>
                    )}
                    {((work.status === 'prechecked_failed' && getPrecheckAttempts(work) < 3) ||
                      (work.status === 'rejected' && getReviewAttempts(work) < 2)) && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedResubmitWorkId(work.id)}
                          className={`text-xs px-3 py-1 rounded border transition ${
                            workToResubmit?.id === work.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {workToResubmit?.id === work.id ? 'Editando este trabajo' : 'Editar y reenviar este trabajo'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {sortedOtherRoleWorks.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm text-gray-700 mb-2">
                  Trabajos enviados en tu otro rol ({isAutor ? 'asistente' : 'autor'})
                </h3>
                <div className="space-y-2">
                  {sortedOtherRoleWorks.map((work: any) => (
                    <div key={work.id} className="border border-dashed border-gray-200 rounded-lg px-3 py-2 bg-gray-50/60">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-gray-700 truncate">{work.title || 'Sin título'}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Enviado como {inferSubmissionRole(work)}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                            {getStatusLabel(work.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}