import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard,
  Calendar,
  FileText,
  Award,
  User,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const WORKS_SUBMISSION_DEADLINE_KEY = 'congress_works_submission_deadline';
  const [submissionDeadline, setSubmissionDeadline] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Redirección por rol activo
    if (user.currentRole === 'evaluador') {
      navigate('/evaluador');
    }

    if (user.currentRole === 'comite') {
      navigate('/comite-academico');
    }

    if (user.currentRole === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  if (!user) return null;

  const isLoggedOnly = !user.roles || user.roles.length === 0;

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
    const getPrecheckAttempts = (w: any) => (typeof w?.precheckAttempts === 'number' ? w.precheckAttempts : (typeof w?.attempts === 'number' ? w.attempts : 0));
    const getReviewAttempts = (w: any) => (typeof w?.reviewAttempts === 'number' ? w.reviewAttempts : 0);
    const resubs = myWorks.filter((w: any) => {
      if (w?.status === 'prechecked_failed' && getPrecheckAttempts(w) < 3) return true;
      if (w?.status === 'rejected' && getReviewAttempts(w) < 2) return true;
      return false;
    });

    return {
      blockNewSubmission: true, // bloquea SIEMPRE el acceso desde Acciones disponibles cuando venció la fecha
      blockReason: `Ya no es posible enviar trabajos nuevos (fecha límite: ${submissionDeadline}).`,
      resubmissions: resubs,
    };
  }, [submissionDeadline, user.id]);

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-amber-700 bg-amber-100 px-3 py-1 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            Pendiente
          </span>
        );
      case 'confirmed':
        return (
          <span className="flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            Confirmada
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-red-700 bg-red-100 px-3 py-1 rounded-full text-sm">
            <XCircle className="w-4 h-4" />
            Rechazada
          </span>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl text-gray-800 mb-2">
                Bienvenido, {user.name} {user.lastName}
              </h1>
              <p className="text-gray-600">{user.email}</p>

              <div className="mt-3 flex items-center gap-3">
                <span className="px-4 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {isLoggedOnly && 'Usuario Logueado'}
                  {user.currentRole === 'asistente' && 'Asistente'}
                  {user.currentRole === 'autor' && 'Autor'}
                </span>

                {user.inscriptionStatus && getStatusBadge(user.inscriptionStatus)}
              </div>
            </div>

            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <User className="w-5 h-5" />
              <span>Mi Perfil</span>
            </Link>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-lg">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Notificaciones</h3>
              <p className="text-blue-800 text-sm">
                {isLoggedOnly && 'Completa tu inscripción para convertirte en asistente del congreso.'}
                {user.currentRole === 'asistente' && 'Ya puedes acceder al programa completo y armar tu agenda.'}
                {user.currentRole === 'autor' && 'Tienes nuevos mensajes sobre tus trabajos presentados.'}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <h2 className="text-2xl text-gray-800 mb-4">Acciones Disponibles</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Usuario sin rol */}
          {isLoggedOnly && (
            <Link
              to="/inscripcion"
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
                  <CreditCard className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl text-gray-800">Inscripción al Congreso</h3>
              </div>
              <p className="text-gray-600">
                Inscríbete y realiza el pago para convertirte en asistente
              </p>
            </Link>
          )}

          {/* Asistente o Autor */}
          {(user.currentRole === 'asistente' || user.currentRole === 'autor') && (
            <>
              <Link
                to="/programa-general"
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl text-gray-800">Ver Programa</h3>
                </div>
              </Link>

              <div className="relative group">
                <button
                  type="button"
                  disabled={blockNewSubmission}
                  onClick={() => {
                    if (blockNewSubmission) return;
                    navigate('/envio-trabajos');
                  }}
                  className={`bg-white p-6 rounded-xl shadow-md transition group w-full text-left relative ${
                    blockNewSubmission ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-amber-100 rounded-lg">
                      <FileText className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-xl text-gray-800">Enviar Trabajo</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Presenta tu trabajo científico o relato de experiencia.
                  </p>

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
            </>
          )}

          {/* Autor */}
          {user.currentRole === 'autor' && (
            <Link
              to="/mis-presentaciones"
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Award className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl text-gray-800">Mis Presentaciones</h3>
              </div>
            </Link>
          )}
        </div>

        {/* Reenvíos disponibles cuando venció la fecha */}
        {blockNewSubmission && resubmissions.length > 0 && (user.currentRole === 'asistente' || user.currentRole === 'autor') && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl text-gray-800 mb-2">Trabajos con reenvío disponible</h3>
            <p className="text-sm text-gray-600 mb-4">
              La fecha límite para envíos nuevos ya venció. Si tu trabajo fue observado/rechazado, podés reenviarlo desde acá.
            </p>
            <div className="space-y-3">
              {resubmissions
                .sort((a: any, b: any) => Number(b.id) - Number(a.id))
                .map((w: any) => (
                  <div key={w.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{w.title || 'Sin título'}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Estado: <span className="font-medium">{w.status}</span>
                        {w.axis ? ` • Eje: ${w.axis}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/envio-trabajos?resubmit=${encodeURIComponent(w.id)}`)}
                      className="shrink-0 px-4 py-2 rounded-lg bg-[#2d5016] text-white text-sm font-medium hover:bg-[#3d6b23] transition"
                    >
                      Reenviar
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Estado */}
        <div className="mt-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-8">
          <h3 className="text-2xl mb-4">Tu Estado en el Congreso</h3>

          {isLoggedOnly && (
            <p>Debes completar tu inscripción para participar.</p>
          )}

          {user.currentRole === 'asistente' && (
            <p>Ya puedes acceder a todas las actividades del congreso.</p>
          )}

          {user.currentRole === 'autor' && (
            <p>Además de asistir, puedes presentar trabajos.</p>
          )}
        </div>

      </div>
    </div>
  );
}