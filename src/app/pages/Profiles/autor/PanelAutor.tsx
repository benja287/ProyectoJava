import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../context/AuthContext';
import { Calendar, Clock, MapPin, BookOpen, Image } from 'lucide-react';

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

        <button
          onClick={() => navigate('/envio-trabajos')}
          className="mb-6 bg-[#2d5016] text-white px-4 py-2 rounded"
        >
          Enviar nuevo trabajo
        </button>

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

      </div>
    </div>
  );
}