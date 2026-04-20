import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, MapPin, Trash2, BookOpen, Image, Users, CalendarDays } from 'lucide-react';

interface AgendaItem {
  activityId: string;
  type: 'session' | 'poster' | 'roundtable';
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const typeConfig = {
  session:    { label: 'Mesa Temática',      icon: BookOpen, color: 'blue'   },
  poster:     { label: 'Sesión de Pósters',  icon: Image,    color: 'yellow' },
  roundtable: { label: 'Mesa Redonda',        icon: Users,    color: 'purple' },
} as const;

const colorMap = {
  blue:   { badge: 'bg-blue-100 text-blue-700',     border: 'border-blue-400'   },
  yellow: { badge: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-400' },
  purple: { badge: 'bg-purple-100 text-purple-700', border: 'border-purple-400' },
};

export function MiAgenda() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [agenda, setAgenda]     = useState<AgendaItem[]>([]);
  const [feedback, setFeedback] = useState('');

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { navigate('/'); return; }

    // Cargar agenda guardada del usuario
    const allAgendas: Record<string, AgendaItem[]> = JSON.parse(
      localStorage.getItem('congress_agendas') || '{}'
    );
    const myAgenda: AgendaItem[] = allAgendas[user.id] || [];

    // ── Sincronizar con el cronograma actual ───────────────────────────────
    // Si el admin modificó o eliminó una sesión, actualizamos los datos en la agenda
    const sessions:    any[] = JSON.parse(localStorage.getItem('congress_sessions')    || '[]');
    const posters:     any[] = JSON.parse(localStorage.getItem('congress_posters')     || '[]');
    const roundTables: any[] = JSON.parse(localStorage.getItem('congress_roundtables') || '[]');

    const allActivities: Record<string, any> = {};
    sessions.forEach((s: any) => allActivities[s.id] = {
      name: `${s.code} - ${s.name}`, date: s.date, startTime: s.startTime, endTime: s.endTime, room: s.room,
    });
    posters.forEach((p: any) => allActivities[p.id] = {
      name: p.name, date: p.date, startTime: p.startTime, endTime: p.endTime, room: p.location,
    });
    roundTables.forEach((m: any) => allActivities[m.id] = {
      name: m.title, date: m.date, startTime: m.startTime, endTime: m.endTime, room: m.room,
    });

    // Filtrar actividades eliminadas y actualizar las modificadas
    const synced = myAgenda
      .filter((item) => allActivities[item.activityId] !== undefined)
      .map((item) => ({
        ...item,
        ...allActivities[item.activityId], // sobreescribe con datos actualizados
      }));

    // Si algo cambió, guardar de vuelta
    if (JSON.stringify(synced) !== JSON.stringify(myAgenda)) {
      const allAg = JSON.parse(localStorage.getItem('congress_agendas') || '{}');
      allAg[user.id] = synced;
      localStorage.setItem('congress_agendas', JSON.stringify(allAg));
    }

    // Ordenar por fecha y hora
    synced.sort((a, b) => {
      const dc = a.date.localeCompare(b.date);
      return dc !== 0 ? dc : a.startTime.localeCompare(b.startTime);
    });

    setAgenda(synced);
  }, [user, navigate]);

  if (!user) return null;

  // ── Quitar actividad ───────────────────────────────────────────────────────
  const handleRemove = (activityId: string) => {
    const newAgenda = agenda.filter((a) => a.activityId !== activityId);

    const allAgendas: Record<string, AgendaItem[]> = JSON.parse(
      localStorage.getItem('congress_agendas') || '{}'
    );
    allAgendas[user.id] = newAgenda;
    localStorage.setItem('congress_agendas', JSON.stringify(allAgendas));

    setAgenda(newAgenda);
    setFeedback('Actividad eliminada de tu agenda.');
    setTimeout(() => setFeedback(''), 3000);
  };

  // ── Agrupar por fecha ──────────────────────────────────────────────────────
  const byDate = agenda.reduce<Record<string, AgendaItem[]>>((acc, a) => {
    if (!acc[a.date]) acc[a.date] = [];
    acc[a.date].push(a);
    return acc;
  }, {});

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-4xl">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4">
            <CalendarDays className="w-10 h-10" />
            <div>
              <h1 className="text-4xl">Mi Agenda</h1>
              <p className="text-indigo-100 text-sm mt-1">Tus actividades seleccionadas del congreso</p>
            </div>
          </div>
        </div>

        {/* Feedback global */}
        {feedback && (
          <div className="mb-5 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
            ✔ {feedback}
          </div>
        )}

        {/* Botón volver al programa */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => navigate('/ProgramaCongreso')}
            className="flex items-center gap-2 border border-indigo-400 text-indigo-600 px-4 py-2 rounded hover:bg-indigo-50 transition text-sm"
          >
            Ver programa completo
          </button>
        </div>

        {/* Agenda vacía */}
        {agenda.length === 0 && (
          <div className="bg-white p-10 text-center rounded-xl shadow">
            <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Todavía no agregaste actividades a tu agenda.</p>
            <button
              onClick={() => navigate('/ProgramaCongreso')}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition text-sm"
            >
              Explorar el programa
            </button>
          </div>
        )}

        {/* Actividades agrupadas por fecha */}
        {Object.entries(byDate).map(([date, items]) => (
          <div key={date} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              {formatDate(date)}
            </h2>

            <div className="space-y-4">
              {items.map((item) => {
                const cfg    = typeConfig[item.type];
                const colors = colorMap[cfg.color];
                const Icon   = cfg.icon;

                return (
                  <div
                    key={item.activityId}
                    className={`bg-white rounded-xl shadow p-5 border-l-4 ${colors.border}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${colors.badge}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>

                        <h3 className="font-semibold text-gray-800 text-base mb-2">{item.name}</h3>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {item.startTime} – {item.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {item.room}
                          </span>
                        </div>
                      </div>

                      {/* Botón quitar */}
                      <button
                        onClick={() => handleRemove(item.activityId)}
                        className="shrink-0 flex items-center gap-1 text-sm text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" /> Quitar de mi agenda
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}