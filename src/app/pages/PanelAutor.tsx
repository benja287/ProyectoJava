import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, MapPin, BookOpen, Image, BadgeCheck } from 'lucide-react';
import { CertificateView } from './Certificaciones';

interface Presentation {
  workId: string;
  title: string;
  axis: string;
  type: 'session' | 'poster';
  sessionName: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  stand?: string; // solo para pósters
}

export function PanelAutor() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const WORKS_SUBMISSION_DEADLINE_KEY = 'congress_works_submission_deadline';
  const [submissionDeadline, setSubmissionDeadline] = useState('');

  useEffect(() => {
    if (!user || user.currentRole !== 'autor') {
      navigate('/');
      return;
    }

    const works: any[]         = JSON.parse(localStorage.getItem('congress_works')    || '[]');
    const sessions: any[]      = JSON.parse(localStorage.getItem('congress_sessions') || '[]');
    const posterSessions: any[] = JSON.parse(localStorage.getItem('congress_posters') || '[]');

    // IDs de trabajos del autor actual
    const myWorkIds = new Set(
      works
        .filter((w: any) => w.userId === user.id)
        .map((w: any) => w.id)
    );

    const result: Presentation[] = [];

    // ── Buscar en mesas temáticas ──────────────────────────────────────────
    for (const session of sessions) {
      for (const workId of session.works as string[]) {
        if (!myWorkIds.has(workId)) continue;
        const work = works.find((w) => w.id === workId);
        if (!work) continue;
        result.push({
          workId,
          title:       work.title,
          axis:        work.axis,
          type:        'session',
          sessionName: `${session.code} - ${session.name}`,
          date:        session.date,
          startTime:   session.startTime,
          endTime:     session.endTime,
          room:        session.room,
        });
      }
    }

    // ── Buscar en sesiones de pósters ──────────────────────────────────────
    for (const poster of posterSessions) {
      for (const entry of poster.works as { workId: string; stand: string }[]) {
        if (!myWorkIds.has(entry.workId)) continue;
        const work = works.find((w) => w.id === entry.workId);
        if (!work) continue;
        result.push({
          workId:      entry.workId,
          title:       work.title,
          axis:        work.axis,
          type:        'poster',
          sessionName: poster.name,
          date:        poster.date,
          startTime:   poster.startTime,
          endTime:     poster.endTime,
          room:        poster.location,
          stand:       entry.stand,
        });
      }
    }

    // Ordenar por fecha y hora
    result.sort((a, b) => {
      const dateComp = a.date.localeCompare(b.date);
      return dateComp !== 0 ? dateComp : a.startTime.localeCompare(b.startTime);
    });

    setPresentations(result);
  }, [user, navigate]);

  if (!user) return null;

  useEffect(() => {
    const readDeadline = () => setSubmissionDeadline(localStorage.getItem(WORKS_SUBMISSION_DEADLINE_KEY) || '');
    readDeadline();
    window.addEventListener('focus', readDeadline);
    return () => window.removeEventListener('focus', readDeadline);
  }, []);

  const myAuthorWorks = useMemo(() => {
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const mine = Array.isArray(allWorks) ? allWorks.filter((w: any) => w?.userId === user.id) : [];
    return mine.filter((w: any) => (w?.submittedByRole || 'autor') === 'autor');
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

  const blockNewSubmission = useMemo(() => {
    if (!submissionDeadline) return false;
    const deadlineDate = new Date(`${submissionDeadline}T23:59:59`);
    return Date.now() > deadlineDate.getTime();
  }, [submissionDeadline]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-5xl">

        <div className="bg-gradient-to-r from-[#2d5016] to-[#3d6b23] text-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl">Mis Presentaciones</h1>
        </div>

        <div className="mb-6 relative group inline-block">
          <button
            type="button"
            disabled={blockNewSubmission}
            onClick={() => {
              if (blockNewSubmission) return;
              navigate('/envio-trabajos');
            }}
            className="bg-[#2d5016] text-white px-4 py-2 rounded disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Enviar nuevo trabajo
          </button>
          {blockNewSubmission && submissionDeadline && (
            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition absolute left-1/2 -translate-x-1/2 -top-3 -translate-y-full z-10">
              <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                Ya no es posible enviar trabajos nuevos (fecha límite: {submissionDeadline}).
              </div>
              <div className="mx-auto w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-8 border border-gray-100">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl text-gray-800">Mis trabajos en proceso</h2>
              <p className="text-sm text-gray-600 mt-1">
                Estado del circuito (precheck, evaluación y reenvíos). Si corresponde, podés reenviar desde acá.
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

          {myAuthorWorks.length === 0 ? (
            <p className="text-sm text-gray-500 mt-4">Todavía no enviaste trabajos como autor.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {[...myAuthorWorks]
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
                      <span className="shrink-0 text-xs text-gray-400 mt-1">Sin reenvío</span>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

         
            

        {/* <CertificateView sectionTitle="Certificado de asistencia (rol autor/a)" /> */}

        {presentations.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-xl shadow">
            <p className="text-gray-500">Aún no tenés presentaciones programadas.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {presentations.map((p) => (
              <div
                key={`${p.type}-${p.workId}`}
                className={`bg-white p-6 rounded-xl shadow border-l-4 ${
                  p.type === 'session' ? 'border-blue-500' : 'border-yellow-500'
                }`}
              >
                {/* Badge de tipo */}
                <div className="flex items-center gap-2 mb-3">
                  {p.type === 'session' ? (
                    <span className="flex items-center gap-1 text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      <BookOpen className="w-3 h-3" /> Mesa Temática
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      <Image className="w-3 h-3" /> Sesión de Pósters
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{p.sessionName}</span>
                </div>

                <h3 className="text-xl mb-4 text-gray-800">{p.title}</h3>

                <div className="flex flex-wrap gap-5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(p.date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {p.startTime} – {p.endTime}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {p.room}
                    {p.stand && (
                      <span className="ml-1 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs px-2 py-0.5 rounded">
                        Panel {p.stand}
                      </span>
                    )}
                  </div>
                </div>

                {p.axis && (
                  <p className="mt-3 text-xs text-gray-400">Eje temático: {p.axis}</p>
                )}
              </div>
            ))}
          </div>
        )}
        <br />{/*By Benja*/}
        {/* Certificado (solo autor/a) */}
        <div>
            <Link
                      to="/Certificado"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition font-semibold text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <BadgeCheck className="w-5 h-5 mr-2" />
                      Generar Certificado de Presentación
            </Link> 
       </div>
      </div>
    </div>
  );
}