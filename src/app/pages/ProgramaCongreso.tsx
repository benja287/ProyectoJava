import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  MapPin,
  Plus,
  Check,
  BookOpen,
  Image,
  Users,
  CalendarDays,
  Presentation,
} from 'lucide-react';
import {
  CONGRESS_EVENT_DATES,
  TALLERES_PROGRAMADOS_KEY,
  congressDateRangeCaption,
} from '../constants/congressEvent';

interface AgendaItem {
  activityId: string;
  type: 'session' | 'poster' | 'roundtable' | 'workshop';
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface Activity {
  id: string;
  type: 'session' | 'poster' | 'roundtable' | 'workshop';
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  code?: string;
  works?: string[];
  posterWorks?: { workId: string; stand: string }[];
  description?: string;
  moderator?: string;
  panelists?: string;
  responsables?: string;
}

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const overlaps = (a: AgendaItem, b: { date: string; startTime: string; endTime: string }) => {
  if (a.date !== b.date) return false;
  return (
    toMinutes(a.startTime) < toMinutes(b.endTime) &&
    toMinutes(b.startTime) < toMinutes(a.endTime)
  );
};

const typeConfig = {
  session: {
    label: 'Mesa Temática',
    Icon: BookOpen,
    border: 'border-green-500',
    badge: 'bg-green-100 text-green-900',
  },
  roundtable: {
    label: 'Mesa Redonda',
    Icon: Users,
    border: 'border-blue-500',
    badge: 'bg-blue-100 text-blue-900',
  },
  poster: {
    label: 'Sesión de Pósters',
    Icon: Image,
    border: 'border-yellow-500',
    badge: 'bg-amber-100 text-amber-900',
  },
  workshop: {
    label: 'Taller',
    Icon: Presentation,
    border: 'border-teal-500',
    badge: 'bg-teal-100 text-teal-900',
  },
} as const;

function normalizeActivities(): Activity[] {
  const sesiones = JSON.parse(localStorage.getItem('congress_sessions') || '[]');
  const redondas = JSON.parse(localStorage.getItem('congress_roundtables') || '[]');
  const posters = JSON.parse(localStorage.getItem('congress_posters') || '[]');
  const tallerProg = JSON.parse(localStorage.getItem(TALLERES_PROGRAMADOS_KEY) || '[]');

  const normalized: Activity[] = [
    ...sesiones.map((s: any) => ({
      id: s.id,
      type: 'session' as const,
      name: `${s.code} - ${s.name}`,
      code: s.code,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
      works: s.works,
    })),
    ...redondas.map((m: any) => ({
      id: m.id,
      type: 'roundtable' as const,
      name: m.title,
      date: m.date,
      startTime: m.startTime,
      endTime: m.endTime,
      room: m.room,
      description: m.description,
      moderator: m.moderator,
      panelists: typeof m.panelists === 'string' ? m.panelists : (m.panelists ?? []).join(', '),
    })),
    ...posters.map((p: any) => ({
      id: p.id,
      type: 'poster' as const,
      name: p.name,
      date: p.date,
      startTime: p.startTime,
      endTime: p.endTime,
      room: p.location,
      posterWorks: p.works,
    })),
    ...tallerProg.map((t: any) => ({
      id: t.id,
      type: 'workshop' as const,
      name: t.titulo,
      date: t.fecha,
      startTime: t.startTime,
      endTime: t.endTime,
      room: t.room,
      description: t.descripcion,
      responsables: t.responsables,
    })),
  ];

  normalized.sort((a, b) => {
    const dc = a.date.localeCompare(b.date);
    return dc !== 0 ? dc : a.startTime.localeCompare(b.startTime);
  });
  return normalized;
}

export function ProgramaCongreso() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [feedback, setFeedback] = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const canAgenda = !!(
    user &&
    (user.roles?.includes('asistente') || user.currentRole === 'asistente')
  );

  useEffect(() => {
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const allUsers = JSON.parse(localStorage.getItem('congress_users') || '[]');
    setWorks(allWorks);
    setUsers(allUsers);
    setAllActivities(normalizeActivities());
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setAgenda([]);
      return;
    }
    const allAgendas: Record<string, AgendaItem[]> = JSON.parse(
      localStorage.getItem('congress_agendas') || '{}'
    );
    setAgenda(allAgendas[user.id] || []);
  }, [user?.id]);

  /** Refrescar si el usuario vuelve desde otra pestaña con datos nuevos */
  useEffect(() => {
    const onFocus = () => setAllActivities(normalizeActivities());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const tabDates = useMemo(() => {
    const fromData = [...new Set(allActivities.map((a) => a.date).filter(Boolean))].sort();
    if (fromData.length > 0) return fromData;
    return [...CONGRESS_EVENT_DATES];
  }, [allActivities]);

  useEffect(() => {
    if (activeDayIndex >= tabDates.length) setActiveDayIndex(0);
  }, [tabDates.length, activeDayIndex]);

  const selectedDate = tabDates[activeDayIndex] ?? tabDates[0];
  const activitiesForDay = useMemo(() => {
    return allActivities.filter((a) => a.date === selectedDate);
  }, [allActivities, selectedDate]);

  const getAuthor = (userId: string) => {
    const u = users.find((u) => u.id === userId);
    return u ? `${u.name} ${u.lastName}` : 'Autor desconocido';
  };

  const isInAgenda = (id: string) => agenda.some((a) => a.activityId === id);

  const hasConflict = (id: string, date: string, startTime: string, endTime: string) =>
    !isInAgenda(id) && agenda.some((item) => overlaps(item, { date, startTime, endTime }));

  const saveAgenda = (newAgenda: AgendaItem[]) => {
    if (!user?.id) return;
    const allAgendas: Record<string, AgendaItem[]> = JSON.parse(
      localStorage.getItem('congress_agendas') || '{}'
    );
    allAgendas[user.id] = newAgenda;
    localStorage.setItem('congress_agendas', JSON.stringify(allAgendas));
    setAgenda(newAgenda);
  };

  const handleAdd = (item: AgendaItem) => {
    if (!user?.id) return;
    if (agenda.find((a) => overlaps(a, item))) {
      setFeedback({ id: item.activityId, msg: 'Ya tenés una actividad en ese horario.', ok: false });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    saveAgenda([...agenda, item]);
    setFeedback({ id: item.activityId, msg: 'Actividad agregada a tu agenda.', ok: true });
    setTimeout(() => setFeedback(null), 3000);
  };

  /** Franjas paralelas dentro del día */
  const timeSlots = useMemo(() => {
    const slots: Activity[][] = [];
    for (const act of activitiesForDay) {
      const slotIdx = slots.findIndex((slot) =>
        slot.some(
          (s) =>
            toMinutes(s.startTime) < toMinutes(act.endTime) &&
            toMinutes(act.startTime) < toMinutes(s.endTime)
        )
      );
      if (slotIdx >= 0) slots[slotIdx].push(act);
      else slots.push([act]);
    }
    return slots;
  }, [activitiesForDay]);

  const ActivityBlock = ({ activity }: { activity: Activity }) => {
    const cfg = typeConfig[activity.type];
    const inAgenda = user?.id ? isInAgenda(activity.id) : false;
    const conflict = user?.id
      ? hasConflict(activity.id, activity.date, activity.startTime, activity.endTime)
      : false;

    const detailLines: string[] = [];
    if (activity.type === 'session' && activity.works?.length) {
      activity.works.forEach((wId, i) => {
        const work = works.find((w) => w.id === wId);
        if (work) detailLines.push(`${i + 1}. ${work.title} — ${getAuthor(work.userId)}`);
      });
    }
    if (activity.type === 'roundtable') {
      if (activity.description) detailLines.push(activity.description);
      if (activity.moderator) detailLines.push(`Modera: ${activity.moderator}`);
      if (activity.panelists) detailLines.push(`Panelistas: ${activity.panelists}`);
    }
    if (activity.type === 'workshop') {
      if (activity.description) detailLines.push(activity.description);
      if (activity.responsables) detailLines.push(`Responsable(s): ${activity.responsables}`);
    }
    if (activity.type === 'poster' && activity.posterWorks?.length) {
      activity.posterWorks.forEach((pw) => {
        const work = works.find((w) => w.id === pw.workId);
        if (work) detailLines.push(`${work.title} — ${getAuthor(work.userId)} (Panel ${pw.stand})`);
      });
    }

    return (
      <div
        className={`flex flex-col sm:flex-row gap-4 sm:gap-5 rounded-xl border border-amber-900/10 bg-white/60 p-4 sm:p-5 shadow-sm ${cfg.border} border-l-4`}
      >
        <div className="sm:w-24 shrink-0 sm:text-right">
          <span className="text-lg font-semibold text-amber-950/90 tabular-nums">
            {activity.startTime}Hs
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${cfg.badge}`}
          >
            <cfg.Icon className="w-3 h-3" />
            {cfg.label}
          </span>

          <h3 className="text-lg font-bold text-amber-950 leading-snug mb-2">{activity.name}</h3>

          {detailLines.length > 0 && (
            <p className="text-sm italic text-indigo-950/80 leading-relaxed mb-3 whitespace-pre-wrap">
              {detailLines.join('\n')}
            </p>
          )}

          <p className="flex flex-wrap items-center gap-1.5 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-amber-900 shrink-0" />
            <span className="font-medium text-amber-950">Lugar:</span>
            <span>{activity.room}</span>
          </p>

          {canAgenda && (
            <div className="mt-4">
              {inAgenda ? (
                <span className="inline-flex items-center gap-1 text-green-800 text-xs font-medium bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                  <Check className="w-3 h-3" /> En mi agenda
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleAdd({
                      activityId: activity.id,
                      type: activity.type,
                      name: activity.name,
                      date: activity.date,
                      startTime: activity.startTime,
                      endTime: activity.endTime,
                      room: activity.room,
                    })
                  }
                  className="inline-flex items-center gap-1 text-white text-xs px-4 py-2 rounded-full bg-amber-900 hover:bg-amber-950 transition shadow-sm"
                >
                  <Plus className="w-3 h-3" /> Agregar a mi agenda
                </button>
              )}
              {conflict && !inAgenda && (
                <p className="text-xs text-amber-700 mt-2">
                  ⚠️ Se superpone con otra actividad agendada.
                </p>
              )}
              {feedback?.id === activity.id && (
                <p
                  className={`text-xs mt-2 font-medium ${feedback.ok ? 'text-green-700' : 'text-red-600'}`}
                >
                  {feedback.msg}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-10 px-4 bg-[#eceaf2]">
      <div className="container mx-auto max-w-3xl">
        {/* Cabecera estilo III CAAE */}
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide text-amber-950 uppercase mb-2">
            Programa
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mb-3">
            Este es el calendario de actividades
          </p>
          <div className="w-14 h-1 bg-yellow-400 mx-auto rounded-full mb-6" />

          {/* Pestañas por día */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {tabDates.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => setActiveDayIndex(i)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition shadow-sm ${
                  activeDayIndex === i
                    ? 'bg-yellow-400 text-white ring-2 ring-yellow-500/40'
                    : 'bg-amber-900 text-white hover:bg-amber-950'
                }`}
              >
                Día {i + 1}
              </button>
            ))}
          </div>

          <p className="text-gray-600 text-sm">{congressDateRangeCaption()}</p>

          {canAgenda && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => navigate('/MiAgenda')}
                className="inline-flex items-center gap-2 rounded-full bg-amber-900 text-white px-5 py-2 text-sm font-medium hover:bg-amber-950 transition shadow"
              >
                <CalendarDays className="w-4 h-4" />
                Ver mi agenda ({agenda.length})
              </button>
            </div>
          )}
        </header>

        {/* Lista del día */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-amber-900/10 px-4 py-6 sm:px-8">
          {allActivities.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              El programa aún no fue publicado por el organizador.
            </p>
          ) : activitiesForDay.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              No hay actividades cargadas para este día.
            </p>
          ) : (
            <div className="space-y-10">
              {timeSlots.map((slot, slotIdx) => (
                <div
                  key={slot.map((a) => a.id).join('-') || String(slotIdx)}
                  className={`grid ${slot.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-4'}`}
                >
                  {slot.map((activity) => (
                    <div key={activity.id} className="min-w-0">
                      <ActivityBlock activity={activity} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {!user && (
          <p className="text-center text-sm text-gray-600 mt-8">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-amber-900 font-semibold underline underline-offset-2 hover:text-amber-950"
            >
              Iniciá sesión
            </button>{' '}
            como asistente para armar tu agenda personal.
          </p>
        )}
      </div>
    </div>
  );
}
