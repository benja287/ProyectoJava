import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { BadgeCheck, CalendarDays, FileText, Presentation } from 'lucide-react';
import { CertificateView } from './Certificaciones';

export function PanelAsistente() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const WORKS_SUBMISSION_DEADLINE_KEY = 'congress_works_submission_deadline';
  const [submissionDeadline, setSubmissionDeadline] = useState('');

  useEffect(() => {
    // 🔒 No logueado → login
    if (!user) {
      navigate('/login');
      return;
    }

    // 🔒 Solo asistentes o autores
    if (!user.roles?.includes('asistente') && !user.roles?.includes('autor')) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  if (!user) return null;

  const isAsistente = user.roles?.includes('asistente');
  const isAlsoAutor = user.roles?.includes('autor');
  /** Con ambos roles, el envío de trabajos va solo con rol autor (panel Autor). */
  const envioTrabajoDesdeAsistente = isAsistente && !isAlsoAutor;

  useEffect(() => {
    const readDeadline = () =>
      setSubmissionDeadline(localStorage.getItem(WORKS_SUBMISSION_DEADLINE_KEY) || '');
    readDeadline();
    window.addEventListener('focus', readDeadline);
    return () => window.removeEventListener('focus', readDeadline);
  }, []);

  const { blockNewSubmission, blockReason, resubmissions } = useMemo(() => {
    if (!submissionDeadline) return { blockNewSubmission: false, blockReason: '', resubmissions: [] as any[] };
    const deadlineDate = new Date(`${submissionDeadline}T23:59:59`);
    const deadlinePassed = Date.now() > deadlineDate.getTime();
    if (!deadlinePassed) return { blockNewSubmission: false, blockReason: '', resubmissions: [] as any[] };

    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const myWorks = Array.isArray(allWorks) ? allWorks.filter((w: any) => w?.userId === user.id) : [];
    const onlyAsistenteWorks = myWorks.filter((w: any) => (w?.submittedByRole || 'asistente') === 'asistente');
    const getPrecheckAttempts = (w: any) =>
      typeof w?.precheckAttempts === 'number' ? w.precheckAttempts : (typeof w?.attempts === 'number' ? w.attempts : 0);
    const getReviewAttempts = (w: any) => (typeof w?.reviewAttempts === 'number' ? w.reviewAttempts : 0);
    const resubs = onlyAsistenteWorks.filter((w: any) => {
      if (w?.status === 'prechecked_failed' && getPrecheckAttempts(w) < 3) return true;
      if (w?.status === 'rejected' && getReviewAttempts(w) < 2) return true;
      return false;
    });

    return {
      blockNewSubmission: true, // bloquea el acceso “Enviar Trabajo” si venció la fecha
      blockReason: `Ya no es posible enviar trabajos nuevos (fecha límite: ${submissionDeadline}).`,
      resubmissions: resubs,
    };
  }, [submissionDeadline, user.id]);

  const myAssistantWorks = useMemo(() => {
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const mine = Array.isArray(allWorks) ? allWorks.filter((w: any) => w?.userId === user.id) : [];
    return mine.filter((w: any) => (w?.submittedByRole || 'asistente') === 'asistente');
  }, [user.id]);

  const getPrecheckAttempts = (w: any) =>
    typeof w?.precheckAttempts === 'number' ? w.precheckAttempts : (typeof w?.attempts === 'number' ? w.attempts : 0);
  const getReviewAttempts = (w: any) => (typeof w?.reviewAttempts === 'number' ? w.reviewAttempts : 0);

  const workStatusLabel = (st?: string) => {
    if (st === 'submitted') return 'Enviado';
    if (st === 'prechecked_ok') return 'Precheck OK';
    if (st === 'prechecked_failed') return 'Observado (reenvío)';
    if (st === 'prechecked_final') return 'No prevalidado final';
    if (st === 'assigned') return 'Asignado a evaluadores';
    if (st === 'under_review') return 'En revisión';
    if (st === 'pending_committee_final') return 'Pendiente confirmación comité';
    if (st === 'approved') return 'Aprobado';
    if (st === 'rejected') return 'Rechazado (reenvío)';
    if (st === 'rejected_final') return 'Rechazado final';
    return st || 'Sin estado';
  };

  const canResubmit = (w: any): boolean => {
    if (w?.status === 'prechecked_failed' && getPrecheckAttempts(w) < 3) return true;
    if (w?.status === 'rejected' && getReviewAttempts(w) < 2) return true;
    return false;
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-4xl">

        {/* <CertificateView sectionTitle="Certificado de asistencia al congreso" /> */}

        {/* ACCIONES */}
        <div className="mt-8">

          <h2 className="text-2xl text-gray-800 mb-4">
            Acciones disponibles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Enviar trabajo: solo cuenta “solo asistente”; si también es autor, indicar panel Autor */}
            {envioTrabajoDesdeAsistente && (
              <div className="relative group">
                <button
                  type="button"
                  disabled={blockNewSubmission}
                  onClick={() => {
                    if (blockNewSubmission) return;
                    navigate('/envio-trabajos');
                  }}
                  className={`bg-white p-6 rounded-xl shadow-md transition w-full text-left relative ${
                    blockNewSubmission ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-lg">
                      <FileText className="w-8 h-8 text-amber-600" />
                    </div>

                    <div>
                      <h3 className="text-xl text-gray-800">Enviar Trabajo</h3>
                      <p className="text-gray-600">
                        Presenta tu trabajo científico o relato de experiencia (1 envío como asistente)
                      </p>
                    </div>
                  </div>

                  {blockNewSubmission && (
                    <div className="absolute inset-0 rounded-xl bg-gray-900/5 pointer-events-none" />
                  )}
                </button>

                {blockNewSubmission && (
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition absolute left-1/2 -translate-x-1/2 -top-3 -translate-y-full z-10">
                    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                      {blockReason}
                    </div>
                    <div className="mx-auto w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                  </div>
                )}
              </div>
            )}

            {isAsistente && isAlsoAutor && (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 rounded-lg shrink-0">
                    <FileText className="w-8 h-8 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-xl text-gray-800">Envío de trabajos científicos</h3>
                    <p className="text-gray-700 text-sm mt-1">
                      Tu cuenta tiene rol autor. Activá <strong>rol autor</strong> en el menú de usuario y entrá a <strong>Mis presentaciones</strong> para enviar o gestionar trabajos (hasta 2 activos).
                    </p>
                  </div>
                </div>
              </div>
            )}
        
            {user.currentRole === 'asistente' && isAsistente && (
              <Link
                to="/proponer-taller"
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <Presentation className="w-8 h-8 text-teal-600" />
                  </div>

                  <div>
                    <h3 className="text-xl text-gray-800">Proponer Taller</h3>
                    <p className="text-gray-600">
                      Enviá tu propuesta de taller para evaluación del comité
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {/* 📅 Mi agenda (solo asistente) */}
            {isAsistente && (
              <Link
                to="/MiAgenda"
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <CalendarDays className="w-8 h-8 text-indigo-600" />
                  </div>

                  <div>
                    <h3 className="text-xl text-gray-800">Ver mi agenda</h3>
                    <p className="text-gray-600">
                      Consultá las actividades que agregaste al cronograma
                    </p>
                  </div>
                </div>
              </Link>
            )}

              {/* <button onClick={() => navigate('/certificado')} 
              className="bg-teal-700 text-white px-4 py-2 rounded 
            hover:bg-teal-800 transition">Generar Certificado</button> */}
            {/* Certificado (solo asistente) */}
            {isAsistente && (
              <Link
                to="/Certificado"
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <BadgeCheck className="w-8 h-8 text-indigo-600" />
                  </div>

                  <div>
                    <h3 className="text-xl text-gray-800">Generar Certificado de Asistencia</h3>
                    <p className="text-gray-600">
                      Generá un certificado de asistencia al congreso para tu rol activo
                    </p>
                  </div>
                </div>
              </Link>
            )}



            
          </div>

          {/* Lista de trabajos en proceso (asistente) */}
          {envioTrabajoDesdeAsistente && (
            <div className="mt-6 bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-lg text-gray-800">Mis trabajos (rol asistente)</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Podés ver el estado y, si corresponde, reenviar correcciones.
                    {blockNewSubmission && (
                      <span className="block mt-1 text-xs text-amber-700">
                        Envíos nuevos bloqueados por fecha. Los reenvíos habilitados siguen disponibles.
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/envio-trabajos')}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition"
                >
                  Ver detalle
                </button>
              </div>

              {myAssistantWorks.length === 0 ? (
                <p className="text-sm text-gray-500 mt-4">Todavía no enviaste trabajos como asistente.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {[...myAssistantWorks]
                    .sort((a: any, b: any) => Number(b.id) - Number(a.id))
                    .map((w: any) => (
                      <div key={w.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{w.title || 'Sin título'}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Estado: <span className="font-medium">{workStatusLabel(w.status)}</span>
                            {w.axis ? ` • Eje: ${w.axis}` : ''}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1">
                            Precheck {Math.min(getPrecheckAttempts(w), 3)}/3 • Revisión {Math.min(getReviewAttempts(w), 2)}/2
                          </div>
                        </div>
                        {canResubmit(w) ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/envio-trabajos?resubmit=${encodeURIComponent(w.id)}`)}
                            className="shrink-0 px-4 py-2 rounded-lg bg-[#2d5016] text-white text-sm font-medium hover:bg-[#3d6b23] transition"
                          >
                            Reenviar
                          </button>
                        ) : (
                          <span className="shrink-0 text-xs text-gray-400 mt-1">
                            Sin reenvío
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}