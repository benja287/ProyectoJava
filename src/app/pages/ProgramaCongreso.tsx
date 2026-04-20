import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, MapPin, Plus, Check, BookOpen, Image, Users, CalendarDays } from 'lucide-react';

interface AgendaItem {
  activityId: string;
  type: 'session' | 'poster' | 'roundtable';
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface Activity {
  id: string;
  type: 'session' | 'poster' | 'roundtable';
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  // campos extra según tipo
  code?: string;
  works?: string[];           // IDs para mesas temáticas
  posterWorks?: { workId: string; stand: string }[];
  description?: string;
  moderator?: string;
  panelists?: string;
}

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const overlaps = (a: AgendaItem, b: { date: string; startTime: string; endTime: string }) => {
  if (a.date !== b.date) return false;
  return toMinutes(a.startTime) < toMinutes(b.endTime) &&
         toMinutes(b.startTime) < toMinutes(a.endTime);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'Sin fecha';
  const [y, m, d] = dateStr.split('-');
  // Nombre del día
  const date = new Date(`${y}-${m}-${d}T12:00:00`);
  const dayName = date.toLocaleDateString('es-AR', { weekday: 'long' });
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${d}/${m}/${y}`;
};

const typeConfig = {
  session:    { label: 'Mesa Temática',     Icon: BookOpen, border: 'border-green-400',  bg: 'bg-green-50',  badge: 'bg-green-100 text-green-800'  },
  roundtable: { label: 'Mesa Redonda',      Icon: Users,    border: 'border-blue-400',   bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-800'    },
  poster:     { label: 'Sesión de Pósters', Icon: Image,    border: 'border-yellow-400', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800' },
} as const;

export function ProgramaCongreso() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [works, setWorks]                 = useState<any[]>([]);
  const [users, setUsers]                 = useState<any[]>([]);
  const [agenda, setAgenda]               = useState<AgendaItem[]>([]);
  const [feedback, setFeedback]           = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  const canAgenda = !!(user?.roles?.includes('asistente') || user?.currentRole === 'asistente');

  useEffect(() => {
    if (!user) { navigate('/'); return; }

    const sesiones = JSON.parse(localStorage.getItem('congress_sessions')    || '[]');
    const redondas = JSON.parse(localStorage.getItem('congress_roundtables') || '[]');
    const allWorks = JSON.parse(localStorage.getItem('congress_works')       || '[]');
    const allUsers = JSON.parse(localStorage.getItem('congress_users')       || '[]');
    const posters  = JSON.parse(localStorage.getItem('congress_posters')     || '[]');

    setWorks(allWorks);
    setUsers(allUsers);

    // Normalizar todo a un array común
    const normalized: Activity[] = [
      ...sesiones.map((s: any) => ({
        id: s.id, type: 'session' as const,
        name: `${s.code} - ${s.name}`, code: s.code,
        date: s.date, startTime: s.startTime, endTime: s.endTime, room: s.room,
        works: s.works,
      })),
      ...redondas.map((m: any) => ({
        id: m.id, type: 'roundtable' as const,
        name: m.title,
        date: m.date, startTime: m.startTime, endTime: m.endTime, room: m.room,
        description: m.description, moderator: m.moderator, panelists: m.panelists,
      })),
      ...posters.map((p: any) => ({
        id: p.id, type: 'poster' as const,
        name: p.name,
        date: p.date, startTime: p.startTime, endTime: p.endTime, room: p.location,
        posterWorks: p.works,
      })),
    ];

    // Ordenar por fecha → hora de inicio
    normalized.sort((a, b) => {
      const dc = a.date.localeCompare(b.date);
      return dc !== 0 ? dc : a.startTime.localeCompare(b.startTime);
    });

    setAllActivities(normalized);

    const allAgendas: Record<string, AgendaItem[]> = JSON.parse(
      localStorage.getItem('congress_agendas') || '{}'
    );
    setAgenda(allAgendas[user.id] || []);
  }, [user, navigate]);

  if (!user) return null;

  const getAuthor = (userId: string) => {
    const u = users.find((u) => u.id === userId);
    return u ? `${u.name} ${u.lastName}` : 'Autor desconocido';
  };

  // ── Agenda helpers ─────────────────────────────────────────────────────────
  const isInAgenda = (id: string) => agenda.some((a) => a.activityId === id);

  const hasConflict = (id: string, date: string, startTime: string, endTime: string) =>
    !isInAgenda(id) && agenda.some((item) => overlaps(item, { date, startTime, endTime }));

  const saveAgenda = (newAgenda: AgendaItem[]) => {
    const allAgendas: Record<string, AgendaItem[]> = JSON.parse(
      localStorage.getItem('congress_agendas') || '{}'
    );
    allAgendas[user.id] = newAgenda;
    localStorage.setItem('congress_agendas', JSON.stringify(allAgendas));
    setAgenda(newAgenda);
  };

  const handleAdd = (item: AgendaItem) => {
    if (agenda.find((a) => overlaps(a, item))) {
      setFeedback({ id: item.activityId, msg: 'Ya tenés una actividad en ese horario.', ok: false });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    saveAgenda([...agenda, item]);
    setFeedback({ id: item.activityId, msg: 'Actividad agregada a tu agenda.', ok: true });
    setTimeout(() => setFeedback(null), 3000);
  };

  // ── Agrupar por fecha ──────────────────────────────────────────────────────
  const byDate = allActivities.reduce<Record<string, Activity[]>>((acc, a) => {
    const key = a.date || 'sin-fecha';
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  // ── Tarjeta de actividad ───────────────────────────────────────────────────
  const ActivityCard = ({ activity }: { activity: Activity }) => {
    const cfg      = typeConfig[activity.type];
    const inAgenda = isInAgenda(activity.id);
    const conflict = hasConflict(activity.id, activity.date, activity.startTime, activity.endTime);

    return (
      <div className={`border-l-4 ${cfg.border} ${cfg.bg} rounded-xl p-5 shadow-sm`}>
        {/* Tipo badge */}
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mb-3 ${cfg.badge}`}>
          <cfg.Icon className="w-3 h-3" />
          {cfg.label}
        </span>

        <h3 className="text-base font-semibold text-gray-800 mb-2">{activity.name}</h3>

        {/* Horario y sala */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {activity.startTime} – {activity.endTime}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {activity.room}
          </span>
        </div>

        {/* Contenido específico por tipo */}
        {activity.type === 'session' && activity.works && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Exposiciones</p>
            {activity.works.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Sin trabajos asignados</p>
            ) : (
              <ol className="space-y-1">
                {activity.works.map((wId, i) => {
                  const work = works.find((w) => w.id === wId);
                  return work ? (
                    <li key={wId} className="text-xs text-gray-700">
                      <span className="font-medium">{i + 1}. {work.title}</span>
                      <span className="text-gray-500"> — {getAuthor(work.userId)}</span>
                    </li>
                  ) : null;
                })}
              </ol>
            )}
          </div>
        )}

        {activity.type === 'roundtable' && (
          <div className="mb-3 text-xs text-gray-600 space-y-0.5">
            {activity.description && <p className="italic mb-1">{activity.description}</p>}
            {activity.moderator  && <p><strong>Modera:</strong> {activity.moderator}</p>}
            {activity.panelists  && <p><strong>Panelistas:</strong> {activity.panelists}</p>}
          </div>
        )}

        {activity.type === 'poster' && activity.posterWorks && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Pósters</p>
            {activity.posterWorks.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Sin pósters asignados</p>
            ) : (
              <ul className="space-y-1">
                {activity.posterWorks.map((pw) => {
                  const work = works.find((w) => w.id === pw.workId);
                  return work ? (
                    <li key={pw.workId} className="text-xs text-gray-700">
                      <span className="font-medium">{work.title}</span>
                      <span className="text-gray-500"> — {getAuthor(work.userId)} | Panel {pw.stand}</span>
                    </li>
                  ) : null;
                })}
              </ul>
            )}
          </div>
        )}

        {/* Botón agenda */}
        {canAgenda && (
          <div className="mt-2">
            {inAgenda ? (
              <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                <Check className="w-3 h-3" /> En mi agenda
              </span>
            ) : (
              <button
                onClick={() => handleAdd({
                  activityId: activity.id, type: activity.type, name: activity.name,
                  date: activity.date, startTime: activity.startTime,
                  endTime: activity.endTime, room: activity.room,
                })}
                className="inline-flex items-center gap-1 text-white text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition"
              >
                <Plus className="w-3 h-3" /> Agregar a mi agenda
              </button>
            )}
            {conflict && !inAgenda && (
              <p className="text-xs text-amber-600 mt-1">⚠️ Se superpone con otra actividad agendada.</p>
            )}
            {feedback?.id === activity.id && (
              <p className={`text-xs mt-1 font-medium ${feedback.ok ? 'text-green-600' : 'text-red-600'}`}>
                {feedback.msg}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-5xl">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl mb-2">Programa del Congreso</h1>
          <p className="text-gray-600">Todas las actividades ordenadas por fecha y horario</p>
        </div>

        {/* Botón mi agenda */}
        {canAgenda && (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => navigate('/MiAgenda')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition text-sm"
            >
              <CalendarDays className="w-4 h-4" />
              Ver mi agenda ({agenda.length})
            </button>
          </div>
        )}

        {/* Sin contenido */}
        {allActivities.length === 0 && (
          <div className="bg-white p-10 text-center rounded-xl shadow">
            <p className="text-gray-500">El programa aún no fue publicado por el organizador.</p>
          </div>
        )}

        {/* Por fecha */}
        {Object.entries(byDate).map(([date, activities]) => {
          // Dentro de cada fecha, agrupar franjas horarias simultáneas
          // para mostrarlas en columnas cuando coinciden
          const timeSlots: Activity[][] = [];
          for (const act of activities) {
            // Buscar si ya existe un slot con actividades que se superponen
            const slotIdx = timeSlots.findIndex((slot) =>
              slot.some(
                (s) =>
                  toMinutes(s.startTime) < toMinutes(act.endTime) &&
                  toMinutes(act.startTime) < toMinutes(s.endTime)
              )
            );
            if (slotIdx >= 0) {
              timeSlots[slotIdx].push(act);
            } else {
              timeSlots.push([act]);
            }
          }

          return (
            <div key={date} className="mb-10">
              {/* Cabecera de fecha */}
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-semibold shadow">
                  <Calendar className="w-4 h-4" />
                  {formatDate(date)}
                </div>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              {/* Franjas horarias */}
              <div className="space-y-4">
                {timeSlots.map((slot, slotIdx) => (
                  <div
                    key={slotIdx}
                    className={`grid gap-4 ${slot.length === 1 ? 'grid-cols-1' : slot.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}
                  >
                    {slot.map((activity) => (
                      <ActivityCard key={activity.id} activity={activity} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}