import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ClipboardCheck, FileText, MessageSquare, Presentation } from 'lucide-react'; // NUEVO: ícono para feedback

const TALLERES_KEY = 'congress_talleres_propuestos';

export function PanelEvaluador() {
  const { user, sendNotificationToUser } = useAuth(); // NUEVO: traemos sendNotificationToUser
  const navigate = useNavigate();
  const [works, setWorks] = useState<any[]>([]);
  const [talleres, setTalleres] = useState<any[]>([]);

  // NUEVO: estado para guardar el texto de feedback por cada trabajo
  // es un objeto { [workId]: string } para manejar múltiples trabajos abiertos
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  // NUEVO: estado para mostrar/ocultar el área de feedback por trabajo
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});

  const [tallerFeedbacks, setTallerFeedbacks] = useState<Record<string, string>>({});
  const [showTallerFeedback, setShowTallerFeedback] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    if (user.currentRole !== 'evaluador') {
      navigate('/');
      return;
    }

    const storedWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const pendingWorks = storedWorks.filter(
      (w: any) => w.status === 'pending' && w.userId !== user.id
    );
    setWorks(pendingWorks);

    const storedTalleres = JSON.parse(localStorage.getItem(TALLERES_KEY) || '[]');
    const pendingTalleres = storedTalleres.filter(
      (t: any) => t.status === 'pending' && t.userId !== user.id
    );
    setTalleres(pendingTalleres);
  }, [user, navigate]);

  if (!user) return null;

  const handleApprove = (workId: string) => {
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const work = allWorks.find((w: any) => w.id === workId);

    const updatedWorks = allWorks.map((w: any) =>
      w.id === workId ? { ...w, status: 'approved' } : w
    );
    localStorage.setItem('congress_works', JSON.stringify(updatedWorks));

    // Convertir usuario en autor — sin cambios
    const users = JSON.parse(localStorage.getItem('congress_users') || '[]');
    const updatedUsers = users.map((u: any) =>
      u.id === work.userId
        ? { ...u, roles: [...new Set([...(u.roles || []), 'autor'])] }
        : u
    );
    localStorage.setItem('congress_users', JSON.stringify(updatedUsers));

    // NUEVO: notificar al autor que su trabajo fue aprobado
    // si el evaluador escribió feedback, se incluye en el mensaje; si no, mensaje genérico
    const feedbackText = feedbacks[workId]?.trim();
    const message = feedbackText
      ? `Tu trabajo "${work.title}" fue aprobado. Comentario del evaluador: ${feedbackText}`
      : `Tu trabajo "${work.title}" fue aprobado. ¡Felicitaciones!`;

    sendNotificationToUser(work.userId, 'Trabajo aprobado', message);

    setWorks(
      updatedWorks.filter(
        (w: any) => w.status === 'pending' && w.userId !== user.id
      )
    );

    // NUEVO: limpia el feedback de ese trabajo del estado local
    setFeedbacks(prev => { const copy = { ...prev }; delete copy[workId]; return copy; });
    setShowFeedback(prev => { const copy = { ...prev }; delete copy[workId]; return copy; });
  };

  const handleReject = (workId: string) => {
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const work = allWorks.find((w: any) => w.id === workId); // NUEVO: necesitamos el trabajo para el mensaje

    const updatedWorks = allWorks.map((w: any) =>
      w.id === workId
        ? { ...w, status: 'rejected', attempts: (w.attempts || 1) + 1 }
        : w
    );
    localStorage.setItem('congress_works', JSON.stringify(updatedWorks));

    // NUEVO: notificar al autor que su trabajo fue rechazado
    const feedbackText = feedbacks[workId]?.trim();
    const message = feedbackText
      ? `Tu trabajo "${work.title}" no fue aprobado. Comentario del evaluador: ${feedbackText}`
      : `Tu trabajo "${work.title}" no fue aprobado. Podés volver a enviarlo con correcciones.`;

    sendNotificationToUser(work.userId, 'Trabajo no aprobado', message);

    setWorks(updatedWorks.filter((w: any) => w.status === 'pending' && w.userId !== user.id));

    // NUEVO: limpia el feedback de ese trabajo del estado local
    setFeedbacks(prev => { const copy = { ...prev }; delete copy[workId]; return copy; });
    setShowFeedback(prev => { const copy = { ...prev }; delete copy[workId]; return copy; });
  };

  const handleApproveTaller = (tallerId: string) => {
    const all = JSON.parse(localStorage.getItem(TALLERES_KEY) || '[]');
    const taller = all.find((t: any) => t.id === tallerId);

    const updated = all.map((t: any) =>
      t.id === tallerId ? { ...t, status: 'approved' } : t
    );
    localStorage.setItem(TALLERES_KEY, JSON.stringify(updated));

    const feedbackText = tallerFeedbacks[tallerId]?.trim();
    const nombre = taller?.titulo ?? 'tu propuesta';
    const message = feedbackText
      ? `Tu propuesta de taller "${nombre}" fue aprobada. Comentario del evaluador: ${feedbackText}`
      : `Tu propuesta de taller "${nombre}" fue aprobada. ¡Felicitaciones!`;

    sendNotificationToUser(taller.userId, 'Taller aprobado', message);

    setTalleres(updated.filter((t: any) => t.status === 'pending' && t.userId !== user!.id));

    setTallerFeedbacks((prev) => {
      const copy = { ...prev };
      delete copy[tallerId];
      return copy;
    });
    setShowTallerFeedback((prev) => {
      const copy = { ...prev };
      delete copy[tallerId];
      return copy;
    });
  };

  const handleRejectTaller = (tallerId: string) => {
    const all = JSON.parse(localStorage.getItem(TALLERES_KEY) || '[]');
    const taller = all.find((t: any) => t.id === tallerId);

    const updated = all.map((t: any) =>
      t.id === tallerId ? { ...t, status: 'rejected' } : t
    );
    localStorage.setItem(TALLERES_KEY, JSON.stringify(updated));

    const feedbackText = tallerFeedbacks[tallerId]?.trim();
    const nombre = taller?.titulo ?? 'tu propuesta';
    const message = feedbackText
      ? `Tu propuesta de taller "${nombre}" no fue aprobada. Comentario del evaluador: ${feedbackText}`
      : `Tu propuesta de taller "${nombre}" no fue aprobada.`;

    sendNotificationToUser(taller.userId, 'Taller no aprobado', message);

    setTalleres(updated.filter((t: any) => t.status === 'pending' && t.userId !== user!.id));

    setTallerFeedbacks((prev) => {
      const copy = { ...prev };
      delete copy[tallerId];
      return copy;
    });
    setShowTallerFeedback((prev) => {
      const copy = { ...prev };
      delete copy[tallerId];
      return copy;
    });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-6xl">

        {/* Header — sin cambios */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4">
            <ClipboardCheck className="w-12 h-12 text-purple-600" />
            <div>
              <h1 className="text-3xl text-gray-800">Panel de Evaluador</h1>
              <p className="text-gray-600">
                Evaluación de trabajos científicos y propuestas de taller
              </p>
            </div>
          </div>
        </div>

        {/* Stats — sin cambios */}
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

        {/* Trabajos propuestos */}
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
                        {work.type}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {work.axis}
                      </span>
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                        Pendiente
                      </span>
                    </div>
                  </div>
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>

                {/* NUEVO: botón para mostrar/ocultar el área de feedback opcional */}
                <button
                  onClick={() =>
                    setShowFeedback(prev => ({ ...prev, [work.id]: !prev[work.id] }))
                  }
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition mb-3"
                >
                  <MessageSquare className="w-4 h-4" />
                  {showFeedback[work.id] ? 'Ocultar comentario' : 'Agregar comentario (opcional)'}
                </button>

                {/* NUEVO: área de texto de feedback, solo visible si el evaluador la abrió */}
                {showFeedback[work.id] && (
                  <textarea
                    value={feedbacks[work.id] || ''}
                    onChange={(e) =>
                      setFeedbacks(prev => ({ ...prev, [work.id]: e.target.value }))
                    }
                    placeholder="Escribí tu devolución al autor. Tu identidad no será revelada."
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 mb-3"
                  />
                )}

                {/* Botones aprobar/rechazar — misma lógica, ahora también envían notificación */}
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

        {/* Talleres propuestos */}
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-6">
            <Presentation className="w-10 h-10 text-teal-600" />
            <div>
              <h2 className="text-2xl text-gray-800">Talleres Propuestos</h2>
              <p className="text-gray-600">
                Pendientes: {talleres.length}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {talleres.length === 0 ? (
              <div className="text-center text-gray-500 py-10 bg-white rounded-xl shadow-md">
                No hay talleres pendientes de evaluación
              </div>
            ) : (
              talleres.map((taller: any) => (
                <div
                  key={taller.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-4">
                      <h3 className="text-xl text-gray-800 mb-2">{taller.titulo}</h3>
                      {taller.fechaEnvio && (
                        <p className="text-xs text-gray-500 mb-2">
                          Enviado:{' '}
                          {new Date(taller.fechaEnvio).toLocaleString('es-AR')}
                        </p>
                      )}
                      <p className="text-gray-700 text-sm mb-2">{taller.descripcion}</p>
                      <p className="text-gray-600 text-sm mb-3">
                        <span className="font-medium text-gray-700">Metodología:</span>{' '}
                        {taller.metodologia}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-teal-100 text-teal-900 rounded-full text-sm">
                          PDF: {taller.archivo || '—'}
                        </span>
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                          Pendiente
                        </span>
                      </div>
                    </div>
                    <Presentation className="w-8 h-8 text-gray-400 shrink-0" />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowTallerFeedback((prev) => ({
                        ...prev,
                        [taller.id]: !prev[taller.id],
                      }))
                    }
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition mb-3"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {showTallerFeedback[taller.id]
                      ? 'Ocultar comentario'
                      : 'Agregar comentario (opcional)'}
                  </button>

                  {showTallerFeedback[taller.id] && (
                    <textarea
                      value={tallerFeedbacks[taller.id] || ''}
                      onChange={(e) =>
                        setTallerFeedbacks((prev) => ({
                          ...prev,
                          [taller.id]: e.target.value,
                        }))
                      }
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