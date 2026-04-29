import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ClipboardCheck, FileText, MessageSquare, Presentation, FileDown } from 'lucide-react';
import { openOrDownloadFile } from '../lib/browserFiles';

const TALLERES_KEY = 'congress_talleres_propuestos';
const WORKS_KEY = 'congress_works';
const USERS_KEY = 'congress_users';

export function PanelEvaluador() {
  const { user, sendNotificationToUser } = useAuth();
  const navigate = useNavigate();
  const [works,    setWorks]    = useState<any[]>([]);
  const [talleres, setTalleres] = useState<any[]>([]);

  const [feedbacks,          setFeedbacks]          = useState<Record<string, string>>({});
  const [showFeedback,       setShowFeedback]       = useState<Record<string, boolean>>({});
  const [tallerFeedbacks,    setTallerFeedbacks]    = useState<Record<string, string>>({});
  const [showTallerFeedback, setShowTallerFeedback] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    if (user.currentRole !== 'evaluador') { navigate('/'); return; }

    const storedWorks = JSON.parse(localStorage.getItem(WORKS_KEY) || '[]');
    const assignedToMe = storedWorks.filter((w: any) => {
      const assignments = Array.isArray(w.assignments) ? w.assignments : [];
      const mine = assignments.find((a: any) => a?.evaluatorId === user.id && a?.status !== 'done');
      if (!mine) return false;
      return ['assigned', 'under_review'].includes(w.status) || (!w.status && true);
    });
    setWorks(assignedToMe);

    const storedTalleres = JSON.parse(localStorage.getItem(TALLERES_KEY) || '[]');
    setTalleres(storedTalleres.filter((t: any) => t.status === 'pending' && t.userId !== user.id));
  }, [user, navigate]);

  if (!user) return null;

  // ── Trabajos ────────────────────────────────────────────────────────────────
  const persistAllWorks = (next: any[]) => {
    localStorage.setItem(WORKS_KEY, JSON.stringify(next));
    const assignedToMe = next.filter((w: any) => {
      const assignments = Array.isArray(w.assignments) ? w.assignments : [];
      const mine = assignments.find((a: any) => a?.evaluatorId === user.id && a?.status !== 'done');
      return Boolean(mine) && ['assigned', 'under_review'].includes(w.status);
    });
    setWorks(assignedToMe);
  };

  const handleDecision = (workId: string, decision: 'approve' | 'reject') => {
    const allWorks = JSON.parse(localStorage.getItem(WORKS_KEY) || '[]');
    const work = allWorks.find((w: any) => w.id === workId);
    if (!work) return;

    const now = new Date().toISOString();
    const comment = (feedbacks[workId] || '').trim();

    const prevReviews = Array.isArray(work.reviews) ? work.reviews : [];
    const alreadyReviewed = prevReviews.some((r: any) => r?.evaluatorId === user.id);
    if (alreadyReviewed) return;

    const nextReviews = [
      ...prevReviews,
      { evaluatorId: user.id, decision, comment: comment || undefined, createdAt: now },
    ];

    const prevAssignments = Array.isArray(work.assignments) ? work.assignments : [];
    const nextAssignments = prevAssignments.map((a: any) =>
      a?.evaluatorId === user.id ? { ...a, status: 'done', doneAt: now } : a
    );

    const approvals = nextReviews.filter((r: any) => r?.decision === 'approve').length;
    const rejects = nextReviews.filter((r: any) => r?.decision === 'reject').length;

    let nextStatus: string = work.status || 'under_review';
    if (approvals >= 2) nextStatus = 'approved';
    else if (rejects >= 2) nextStatus = 'rejected';
    else nextStatus = 'under_review';

    const updatedWork = {
      ...work,
      status: nextStatus,
      reviews: nextReviews,
      assignments: nextAssignments,
    };

    const updatedWorks = allWorks.map((w: any) => (w.id === workId ? updatedWork : w));
    persistAllWorks(updatedWorks);

    // Notificar autor
    if (nextStatus === 'approved') {
      sendNotificationToUser(
        updatedWork.userId,
        'Trabajo aprobado por evaluadores',
        comment
          ? `Tu trabajo "${updatedWork.title}" fue aprobado por los evaluadores. Comentario: ${comment}. Ahora queda pendiente la habilitación del rol autor por parte de Administración.`
          : `Tu trabajo "${updatedWork.title}" fue aprobado por los evaluadores. Ahora queda pendiente la habilitación del rol autor por parte de Administración.`,
        'Comité Evaluador'
      );
    } else if (nextStatus === 'rejected') {
      sendNotificationToUser(
        updatedWork.userId,
        'Trabajo no aprobado',
        comment
          ? `Tu trabajo "${updatedWork.title}" no fue aprobado. Comentario del evaluador: ${comment}`
          : `Tu trabajo "${updatedWork.title}" no fue aprobado. Podés volver a enviarlo con correcciones.`,
        'Comité Evaluador'
      );
    } else {
      // estado intermedio: no notificamos “aprobado/rechazado” aún
      sendNotificationToUser(
        updatedWork.userId,
        'Trabajo en evaluación',
        comment
          ? `Se registró una evaluación para tu trabajo "${updatedWork.title}". Comentario: ${comment}`
          : `Se registró una evaluación para tu trabajo "${updatedWork.title}".`,
        'Comité Evaluador'
      );
    }

    setFeedbacks(p => { const c = { ...p }; delete c[workId]; return c; });
    setShowFeedback(p => { const c = { ...p }; delete c[workId]; return c; });
  };

  const handleApprove = (workId: string) => handleDecision(workId, 'approve');
  const handleReject = (workId: string) => handleDecision(workId, 'reject');

  // ── Talleres ─────────────────────────────────────────────────────────────────
  const handleApproveTaller = (tallerId: string) => {
    const all    = JSON.parse(localStorage.getItem(TALLERES_KEY) || '[]');
    const taller = all.find((t: any) => t.id === tallerId);
    const updated = all.map((t: any) => t.id === tallerId ? { ...t, status: 'approved' } : t);
    localStorage.setItem(TALLERES_KEY, JSON.stringify(updated));

    const feedbackText = tallerFeedbacks[tallerId]?.trim();
    const nombre = taller?.titulo ?? 'tu propuesta';
    sendNotificationToUser(
      taller.userId,
      'Taller aprobado',
      feedbackText
        ? `Tu propuesta de taller "${nombre}" fue aprobada. Comentario del evaluador: ${feedbackText}`
        : `Tu propuesta de taller "${nombre}" fue aprobada. ¡Felicitaciones!`
    );

    setTalleres(updated.filter((t: any) => t.status === 'pending' && t.userId !== user.id));
    setTallerFeedbacks(p => { const c = { ...p }; delete c[tallerId]; return c; });
    setShowTallerFeedback(p => { const c = { ...p }; delete c[tallerId]; return c; });
  };

  const handleRejectTaller = (tallerId: string) => {
    const all    = JSON.parse(localStorage.getItem(TALLERES_KEY) || '[]');
    const taller = all.find((t: any) => t.id === tallerId);
    const updated = all.map((t: any) => t.id === tallerId ? { ...t, status: 'rejected' } : t);
    localStorage.setItem(TALLERES_KEY, JSON.stringify(updated));

    const feedbackText = tallerFeedbacks[tallerId]?.trim();
    const nombre = taller?.titulo ?? 'tu propuesta';
    sendNotificationToUser(
      taller.userId,
      'Taller no aprobado',
      feedbackText
        ? `Tu propuesta de taller "${nombre}" no fue aprobada. Comentario del evaluador: ${feedbackText}`
        : `Tu propuesta de taller "${nombre}" no fue aprobada.`
    );

    setTalleres(updated.filter((t: any) => t.status === 'pending' && t.userId !== user.id));
    setTallerFeedbacks(p => { const c = { ...p }; delete c[tallerId]; return c; });
    setShowTallerFeedback(p => { const c = { ...p }; delete c[tallerId]; return c; });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-6xl">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4">
            <ClipboardCheck className="w-12 h-12 text-purple-600" />
            <div>
              <h1 className="text-3xl text-gray-800">Panel de Evaluador</h1>
              <p className="text-gray-600">Evaluación de trabajos científicos y propuestas de taller</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-sm text-gray-600 mb-1">Trabajos Pendientes</p>
            <p className="text-3xl text-amber-600">{works.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-sm text-gray-600 mb-1">Evaluados</p>
            <p className="text-3xl text-green-600">
              {JSON.parse(localStorage.getItem('congress_works') || '[]')
                .filter((w: any) => w.status !== 'pending').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-sm text-gray-600 mb-1">Aprobados</p>
            <p className="text-3xl text-blue-600">
              {JSON.parse(localStorage.getItem('congress_works') || '[]')
                .filter((w: any) => w.status === 'approved').length}
            </p>
          </div>
        </div>

        {/* ══ TRABAJOS PROPUESTOS ══ */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-10 h-10 text-amber-600" />
            <div>
              <h2 className="text-2xl text-gray-800">Trabajos Propuestos</h2>
              <p className="text-gray-600">Pendientes: {works.length}</p>
            </div>
          </div>

          <div className="space-y-4">
            {works.length === 0 ? (
              <div className="text-center text-gray-500 py-10 bg-white rounded-xl shadow-md">
                No hay trabajos pendientes de evaluación
              </div>
            ) : (
              works.map((work) => (
                <div key={work.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl text-gray-800 mb-2">{work.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {work.workType ? (work.workType === 'cientifico' ? 'Científico' : 'Relato de experiencia') : 'Tipo: —'}
                        </span>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                          Modalidad: {(work.modality ?? work.type) || '—'}
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">{work.axis}</span>
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">Pendiente</span>
                      </div>

                      {/* ── VER PDF DEL TRABAJO ── */}
                      <div className="mt-3">
                        {work.fileId || work.filePdfBase64 ? (
                          <button
                            type="button"
                            onClick={() =>
                              openOrDownloadFile({
                                fileId: work.fileId,
                                fileName: work.fileName,
                                filePdfBase64: work.filePdfBase64,
                              })
                            }
                            className="flex items-center gap-2 text-sm text-teal-700 border border-teal-300 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition"
                          >
                            <FileDown className="w-4 h-4" />
                            Ver / descargar PDF
                          </button>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Sin archivo adjunto</p>
                        )}
                      </div>
                    </div>
                    <FileText className="w-8 h-8 text-gray-400 shrink-0 ml-4" />
                  </div>

                  {/* Comentario opcional */}
                  <button
                    onClick={() => setShowFeedback(p => ({ ...p, [work.id]: !p[work.id] }))}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition mb-3"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {showFeedback[work.id] ? 'Ocultar comentario' : 'Agregar comentario (opcional)'}
                  </button>

                  {showFeedback[work.id] && (
                    <textarea
                      value={feedbacks[work.id] || ''}
                      onChange={(e) => setFeedbacks(p => ({ ...p, [work.id]: e.target.value }))}
                      placeholder="Escribí tu devolución al autor. Tu identidad no será revelada."
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 mb-3"
                    />
                  )}

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => handleApprove(work.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(work.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ══ TALLERES PROPUESTOS ══ */}
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-6">
            <Presentation className="w-10 h-10 text-teal-600" />
            <div>
              <h2 className="text-2xl text-gray-800">Talleres Propuestos</h2>
              <p className="text-gray-600">Pendientes: {talleres.length}</p>
            </div>
          </div>

          <div className="space-y-4">
            {talleres.length === 0 ? (
              <div className="text-center text-gray-500 py-10 bg-white rounded-xl shadow-md">
                No hay talleres pendientes de evaluación
              </div>
            ) : (
              talleres.map((taller: any) => (
                <div key={taller.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-4">
                      <h3 className="text-xl text-gray-800 mb-2">{taller.titulo}</h3>
                      {taller.fechaEnvio && (
                        <p className="text-xs text-gray-500 mb-2">
                          Enviado: {new Date(taller.fechaEnvio).toLocaleString('es-AR')}
                        </p>
                      )}
                      <p className="text-gray-700 text-sm mb-2">{taller.descripcion}</p>
                      <p className="text-gray-600 text-sm mb-3">
                        <span className="font-medium text-gray-700">Metodología:</span> {taller.metodologia}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">Pendiente</span>
                      </div>

                      {/* ── VER PDF DEL TALLER ── */}
                      {taller.fileId || taller.filePdfBase64 ? (
                        <button
                          type="button"
                          onClick={() =>
                            openOrDownloadFile({
                              fileId: taller.fileId,
                              fileName: taller.fileName,
                              filePdfBase64: taller.filePdfBase64,
                            })
                          }
                          className="flex items-center gap-2 text-sm text-teal-700 border border-teal-300 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition"
                        >
                          <FileDown className="w-4 h-4" />
                          Ver / descargar PDF
                        </button>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Sin archivo adjunto</p>
                      )}
                    </div>
                    <Presentation className="w-8 h-8 text-gray-400 shrink-0" />
                  </div>

                  {/* Comentario opcional */}
                  <button
                    type="button"
                    onClick={() => setShowTallerFeedback(p => ({ ...p, [taller.id]: !p[taller.id] }))}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition mb-3"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {showTallerFeedback[taller.id] ? 'Ocultar comentario' : 'Agregar comentario (opcional)'}
                  </button>

                  {showTallerFeedback[taller.id] && (
                    <textarea
                      value={tallerFeedbacks[taller.id] || ''}
                      onChange={(e) => setTallerFeedbacks(p => ({ ...p, [taller.id]: e.target.value }))}
                      placeholder="Escribí tu devolución al proponente. Tu identidad no será revelada."
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 mb-3"
                    />
                  )}

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => handleApproveTaller(taller.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectTaller(taller.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}