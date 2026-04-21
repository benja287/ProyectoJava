import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Settings, Bell, Pencil, X, Trash2 } from 'lucide-react';
import { UserRole } from '../context/AuthContext';
import { CONFERENCIAS_KEY, PROGRAM_PUBLISHED_KEY, TALLERES_PROGRAMADOS_KEY } from '../constants/congressEvent';
import type { TallerProgramado } from './AdminCrearTaller';
import type { ConferenciaPrograma } from './AdminCrearConferencia';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Session {
  id: string;
  code: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  works: string[];
}

interface PosterSession {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  works: { workId: string; stand: string }[];
}

interface RoundTable {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  moderator: string;
  panelists: string;
  description: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function PanelAdmin() {
  const { user, sendNotificationToAll, sendNotificationToUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [roundTables, setRoundTables] = useState<RoundTable[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [posterSessions, setPosterSessions] = useState<PosterSession[]>([]);
  const [talleresProgramados, setTalleresProgramados] = useState<TallerProgramado[]>([]);
  const [tallerOkBanner, setTallerOkBanner] = useState(false);
  const [conferencias, setConferencias] = useState<ConferenciaPrograma[]>([]);
  const [confOkBanner, setConfOkBanner] = useState(false);
  const [programPublished, setProgramPublished] = useState(true);

  const [notifForm, setNotifForm] = useState({
    title: '',
    message: '',
    role: '' as UserRole | '',
  });
  const [notifFeedback, setNotifFeedback] = useState('');

  // ── Modal: Mesa Temática ───────────────────────────────────────────────────
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editSessionForm, setEditSessionForm] = useState({
    code: '', name: '', date: '', startTime: '', endTime: '', room: '',
  });

  // ── Modal: Sesión de Pósters ───────────────────────────────────────────────
  const [editingPoster, setEditingPoster] = useState<PosterSession | null>(null);
  const [editPosterForm, setEditPosterForm] = useState({
    name: '', date: '', startTime: '', endTime: '', location: '',
  });

  // ── Modal: Mesa Redonda ────────────────────────────────────────────────────
  const [editingRoundTable, setEditingRoundTable] = useState<RoundTable | null>(null);
  const [editRoundTableForm, setEditRoundTableForm] = useState({
    title: '', date: '', startTime: '', endTime: '', room: '',
    moderator: '', panelists: '', description: '',
  });

  // ── Modal de confirmación de eliminación ──────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'session' | 'poster' | 'roundtable' | 'workshop' | 'conference';
    id: string;
    name: string;
  } | null>(null);

  // ─── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || user.currentRole !== 'admin') {
      navigate('/');
      return;
    }
    const allUsers   = JSON.parse(localStorage.getItem('congress_users')      || '[]');
    const allWorks   = JSON.parse(localStorage.getItem('congress_works')      || '[]');
    const sesiones   = JSON.parse(localStorage.getItem('congress_sessions')   || '[]');
    const mesas      = JSON.parse(localStorage.getItem('congress_roundtables')|| '[]');
    const posters    = JSON.parse(localStorage.getItem('congress_posters')    || '[]');
    const pending    = allUsers.filter((u: any) => u.inscriptionStatus === 'pending');

    setInscriptions(pending);
    setUsers(allUsers);
    setSessions(sesiones);
    setPosterSessions(posters);
    setWorks(allWorks);
    setRoundTables(mesas);
    setTalleresProgramados(JSON.parse(localStorage.getItem(TALLERES_PROGRAMADOS_KEY) || '[]'));
    setConferencias(JSON.parse(localStorage.getItem(CONFERENCIAS_KEY) || '[]'));
    const published = localStorage.getItem(PROGRAM_PUBLISHED_KEY);
    setProgramPublished(published ? JSON.parse(published) : true);
  }, [user, navigate]);

  useEffect(() => {
    const st = location.state as { tallerCreado?: boolean; conferenciaCreada?: boolean } | null;
    if (st?.tallerCreado) {
      setTallerOkBanner(true);
      setTalleresProgramados(JSON.parse(localStorage.getItem(TALLERES_PROGRAMADOS_KEY) || '[]'));
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (st?.conferenciaCreada) {
      setConfOkBanner(true);
      setConferencias(JSON.parse(localStorage.getItem(CONFERENCIAS_KEY) || '[]'));
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  if (!user) return null;

  const deleteTallerProgramado = (id: string) => {
    const updated = talleresProgramados.filter((t) => t.id !== id);
    localStorage.setItem(TALLERES_PROGRAMADOS_KEY, JSON.stringify(updated));
    setTalleresProgramados(updated);
  };

  const deleteConferencia = (id: string) => {
    const updated = conferencias.filter((c) => c.id !== id);
    localStorage.setItem(CONFERENCIAS_KEY, JSON.stringify(updated));
    setConferencias(updated);
  };

  const toggleProgramPublished = () => {
    const next = !programPublished;
    setProgramPublished(next);
    localStorage.setItem(PROGRAM_PUBLISHED_KEY, JSON.stringify(next));
  };

  const notifyAgendaUsers = (activityId: string, title: string, message: string) => {
    const allAgendas: Record<string, any[]> = JSON.parse(localStorage.getItem('congress_agendas') || '{}');
    Object.entries(allAgendas).forEach(([userId, items]) => {
      if (Array.isArray(items) && items.some((it: any) => it.activityId === activityId)) {
        sendNotificationToUser(userId, title, message, 'Administración');
      }
    });
  };

  const notifyAuthorsFromWorks = (workIds: string[], title: string, message: string) => {
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const targets = new Set<string>();
    workIds.forEach((id) => {
      const w = allWorks.find((wk: any) => wk.id === id);
      if (w?.userId) targets.add(w.userId);
    });
    targets.forEach((uid) => sendNotificationToUser(uid, title, message, 'Administración'));
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getAuthor = (userId: string) => {
    const u = users.find((u) => u.id === userId);
    return u ? `${u.name} ${u.lastName}` : 'Autor desconocido';
  };

  /** Restaura el status de un trabajo a 'approved' en congress_works */
  const restoreWorkToApproved = (workId: string) => {
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const updated  = allWorks.map((w: any) =>
      w.id === workId ? { ...w, status: 'approved' } : w
    );
    localStorage.setItem('congress_works', JSON.stringify(updated));
    setWorks(updated);
  };

  // =========================
  // INSCRIPCIONES
  // =========================
  const handleApprove = (userId: string) => {
    const updatedUsers = users.map((u: any) =>
      u.id === userId
        ? { ...u, inscriptionStatus: 'confirmed', roles: [...(u.roles || []), 'asistente'], currentRole: 'asistente' }
        : u
    );
    localStorage.setItem('congress_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setInscriptions(inscriptions.filter((i) => i.id !== userId));
  };

  const handleReject = (userId: string) => {
    const updatedUsers = users.map((u: any) =>
      u.id === userId ? { ...u, inscriptionStatus: 'rejected' } : u
    );
    localStorage.setItem('congress_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setInscriptions(inscriptions.filter((i) => i.id !== userId));
  };

  // =========================
  // EVALUADORES
  // =========================
  const makeEvaluator = (userId: string) => {
    const updatedUsers = users.map((u: any) => {
      if (u.id === userId && !u.roles?.includes('evaluador')) {
        return { ...u, roles: [...(u.roles || []), 'evaluador'] };
      }
      return u;
    });
    localStorage.setItem('congress_users', JSON.stringify(updatedUsers));
    const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
    if (currentUser.id === userId) {
      localStorage.setItem('current_user', JSON.stringify({
        ...currentUser, roles: [...(currentUser.roles || []), 'evaluador'],
      }));
      window.location.reload();
    }
    setUsers(updatedUsers);
  };

  // =========================
  // MESA TEMÁTICA — editar / quitar trabajo / ELIMINAR
  // =========================
  const openEditSession = (s: Session) => {
    setEditingSession(s);
    setEditSessionForm({ code: s.code, name: s.name, date: s.date, startTime: s.startTime, endTime: s.endTime, room: s.room });
  };

  const saveSession = () => {
    if (!editingSession) return;
    const before = editingSession;
    const updated = sessions.map((s) =>
      s.id === editingSession.id ? { ...s, ...editSessionForm } : s
    );
    localStorage.setItem('congress_sessions', JSON.stringify(updated));
    setSessions(updated);
    setEditingSession(null);

    // HU-15: notificar a usuarios con esa actividad en agenda y a autores de trabajos asignados
    const after = updated.find((s) => s.id === before.id) || before;
    const msg = `Se actualizó la actividad \"${after.code} - ${after.name}\".\n` +
      `Nuevo horario: ${after.date} ${after.startTime}–${after.endTime}. Lugar: ${after.room}.`;
    notifyAgendaUsers(after.id, 'Actividad actualizada', msg);
    notifyAuthorsFromWorks(after.works || [], 'Tu actividad fue actualizada', msg);
  };

  const removeWorkFromSession = (sessionId: string, workId: string) => {
    const updatedSessions = sessions.map((s) =>
      s.id === sessionId ? { ...s, works: s.works.filter((id) => id !== workId) } : s
    );
    localStorage.setItem('congress_sessions', JSON.stringify(updatedSessions));
    setSessions(updatedSessions);
    restoreWorkToApproved(workId);
    if (editingSession?.id === sessionId) {
      setEditingSession({ ...editingSession, works: editingSession.works.filter((id) => id !== workId) });
    }
  };

  /** Elimina completamente una mesa temática y restaura todos sus trabajos */
  const deleteSession = (sessionId: string) => {
    const sessionToDelete = sessions.find((s) => s.id === sessionId);
    // Restaurar todos los trabajos asignados a "approved"
    sessionToDelete?.works.forEach((workId) => {
      restoreWorkToApproved(workId);
    });
    const updated = sessions.filter((s) => s.id !== sessionId);
    localStorage.setItem('congress_sessions', JSON.stringify(updated));
    setSessions(updated);
    setConfirmDelete(null);
    if (editingSession?.id === sessionId) setEditingSession(null);
  };

  // =========================
  // SESIÓN DE PÓSTERS — editar / quitar trabajo / ELIMINAR
  // =========================
  const openEditPoster = (p: PosterSession) => {
    setEditingPoster(p);
    setEditPosterForm({ name: p.name, date: p.date, startTime: p.startTime, endTime: p.endTime, location: p.location });
  };

  const savePoster = () => {
    if (!editingPoster) return;
    const before = editingPoster;
    const updated = posterSessions.map((p) =>
      p.id === editingPoster.id ? { ...p, ...editPosterForm } : p
    );
    localStorage.setItem('congress_posters', JSON.stringify(updated));
    setPosterSessions(updated);
    setEditingPoster(null);

    const after = updated.find((p) => p.id === before.id) || before;
    const msg = `Se actualizó la actividad \"${after.name}\".\n` +
      `Nuevo horario: ${after.date} ${after.startTime}–${after.endTime}. Lugar: ${after.location}.`;
    notifyAgendaUsers(after.id, 'Actividad actualizada', msg);
    notifyAuthorsFromWorks((after.works || []).map((w: any) => w.workId), 'Tu actividad fue actualizada', msg);
  };

  const removeWorkFromPoster = (posterId: string, workId: string) => {
    const updatedPosters = posterSessions.map((p) =>
      p.id === posterId
        ? { ...p, works: p.works.filter((w) => w.workId !== workId) }
        : p
    );
    localStorage.setItem('congress_posters', JSON.stringify(updatedPosters));
    setPosterSessions(updatedPosters);
    restoreWorkToApproved(workId);
    if (editingPoster?.id === posterId) {
      setEditingPoster({ ...editingPoster, works: editingPoster.works.filter((w) => w.workId !== workId) });
    }
  };

  /** Elimina completamente una sesión de pósters y restaura todos sus trabajos */
  const deletePoster = (posterId: string) => {
    const poster = posterSessions.find((p) => p.id === posterId);
    // Restaurar todos los pósters asignados a "approved"
    poster?.works.forEach((w) => {
      restoreWorkToApproved(w.workId);
    });
    const updated = posterSessions.filter((p) => p.id !== posterId);
    localStorage.setItem('congress_posters', JSON.stringify(updated));
    setPosterSessions(updated);
    setConfirmDelete(null);
    if (editingPoster?.id === posterId) setEditingPoster(null);
  };

  // =========================
  // MESA REDONDA — editar / ELIMINAR
  // =========================
  const openEditRoundTable = (m: RoundTable) => {
    setEditingRoundTable(m);
    setEditRoundTableForm({
      title: m.title, date: m.date, startTime: m.startTime, endTime: m.endTime,
      room: m.room, moderator: m.moderator, panelists: m.panelists, description: m.description,
    });
  };

  const saveRoundTable = () => {
    if (!editingRoundTable) return;
    const before = editingRoundTable;
    const updated = roundTables.map((m) =>
      m.id === editingRoundTable.id ? { ...m, ...editRoundTableForm } : m
    );
    localStorage.setItem('congress_roundtables', JSON.stringify(updated));
    setRoundTables(updated);
    setEditingRoundTable(null);

    const after = updated.find((m) => m.id === before.id) || before;
    const msg = `Se actualizó la actividad \"${after.title}\".\n` +
      `Nuevo horario: ${after.date} ${after.startTime}–${after.endTime}. Lugar: ${after.room}.`;
    notifyAgendaUsers(after.id, 'Actividad actualizada', msg);
  };

  /** Elimina completamente una mesa redonda (sin trabajos asociados, sin restauración necesaria) */
  const deleteRoundTable = (roundTableId: string) => {
    const updated = roundTables.filter((m) => m.id !== roundTableId);
    localStorage.setItem('congress_roundtables', JSON.stringify(updated));
    setRoundTables(updated);
    setConfirmDelete(null);
    if (editingRoundTable?.id === roundTableId) setEditingRoundTable(null);
  };

  // ── Dispatcher del modal de confirmación ──────────────────────────────────
  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'session')    deleteSession(confirmDelete.id);
    if (confirmDelete.type === 'poster')     deletePoster(confirmDelete.id);
    if (confirmDelete.type === 'roundtable') deleteRoundTable(confirmDelete.id);
    if (confirmDelete.type === 'workshop')   deleteTallerProgramado(confirmDelete.id);
    if (confirmDelete.type === 'conference') deleteConferencia(confirmDelete.id);
  };

  // =========================
  // NOTIFICACIONES
  // =========================
  const handleSendNotification = () => {
    if (!notifForm.title.trim() || !notifForm.message.trim()) {
      setNotifFeedback('error');
      return;
    }
    const count = sendNotificationToAll(
      notifForm.title.trim(), notifForm.message.trim(), notifForm.role || undefined
    );
    setNotifForm({ title: '', message: '', role: '' });
    setNotifFeedback(`ok:${count}`);
  };

  // ─── Clases reutilizables ──────────────────────────────────────────────────
  const inputCls = 'w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300';
  const labelCls = 'block text-sm text-gray-600 mb-1';

  // =========================
  // RENDER
  // =========================
  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4">
            <Settings className="w-12 h-12" />
            <div>
              <h1 className="text-4xl">Panel de Administración</h1>
              <p className="text-indigo-100 mt-2">Gestión completa del congreso</p>
            </div>
          </div>
        </div>

        {/* BOTONES MESAS */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button onClick={() => navigate('/admin/mesas-tematicas')} className="bg-blue-600 text-white px-4 py-2 rounded">
            Crear Mesa Temática
          </button>
          <button onClick={() => navigate('/admin/mesas-redondas')} className="bg-purple-600 text-white px-4 py-2 rounded">
            Crear Mesa Redonda
          </button>
          <button onClick={() => navigate('/admin/posters')} className="bg-yellow-600 text-white px-4 py-2 rounded">
            Crear Sesión de Pósters
          </button>
          <button onClick={() => navigate('/admin/crear-taller')} className="bg-teal-700 text-white px-4 py-2 rounded hover:bg-teal-800 transition">
            Crear Taller
          </button>
          <button onClick={() => navigate('/admin/crear-conferencia')} className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 transition">
            Crear Conferencia
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Programa publicado</h2>
              <p className="text-sm text-gray-600">
                Controla si el cronograma es visible para el público en “Programa”.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleProgramPublished}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                programPublished ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {programPublished ? 'Publicado' : 'No publicado'}
            </button>
          </div>
          {!programPublished && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mt-4">
              Mientras el programa esté “No publicado”, el público verá el mensaje de “aún no fue publicado”.
            </p>
          )}
        </div>

        {tallerOkBanner && (
          <div className="mb-6 bg-teal-50 border border-teal-200 text-teal-900 px-4 py-3 rounded-lg text-sm">
            El taller quedó cargado y visible en el cronograma del congreso.
            <button type="button" className="ml-3 underline font-medium" onClick={() => setTallerOkBanner(false)}>
              Cerrar
            </button>
          </div>
        )}

        {confOkBanner && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 text-indigo-900 px-4 py-3 rounded-lg text-sm">
            La conferencia quedó cargada y visible en el cronograma del congreso.
            <button type="button" className="ml-3 underline font-medium" onClick={() => setConfOkBanner(false)}>
              Cerrar
            </button>
          </div>
        )}

        {/* INSCRIPCIONES */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl mb-6">Validación de Inscripciones</h2>
          {inscriptions.length === 0 && <p className="text-gray-500">No hay inscripciones pendientes.</p>}
          {inscriptions.map((i) => (
            <div key={i.id} className="flex justify-between border p-3 mb-2 rounded">
              <div>{i.name} {i.lastName}</div>
              <div className="flex gap-2">
                <button onClick={() => handleApprove(i.id)} className="bg-green-600 text-white px-2 py-1 rounded">Aprobar</button>
                <button onClick={() => handleReject(i.id)} className="bg-red-600 text-white px-2 py-1 rounded">Rechazar</button>
              </div>
            </div>
          ))}
        </div>

        {/* EVALUADORES */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl mb-6">Asignar Evaluadores</h2>
          {users.map((u) => (
            <div key={u.id} className="flex justify-between items-center border p-3 mb-2 rounded">
              <div>
                <p>{u.name} {u.lastName}</p>
                <div className="flex gap-2 mt-1">
                  {u.roles?.map((r: string) => (
                    <span key={r} className="text-xs bg-gray-200 px-2 rounded">{r}</span>
                  ))}
                </div>
              </div>
              {!u.roles?.includes('evaluador') ? (
                <button onClick={() => makeEvaluator(u.id)} className="bg-purple-600 text-white px-2 py-1 rounded">
                  Hacer evaluador
                </button>
              ) : (
                <span className="text-green-600">✔ Evaluador</span>
              )}
            </div>
          ))}
        </div>

        {/* CRONOGRAMA */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl mb-6">Cronograma del Congreso</h2>

          {/* ── MESAS TEMÁTICAS ── */}
          <h3 className="text-xl mb-4 text-blue-700">Mesas Temáticas</h3>
          {sessions.length === 0 && <p className="text-gray-500 mb-4">No hay mesas temáticas.</p>}
          {[...sessions].sort((a, b) => {
            const d = a.date.localeCompare(b.date);
            return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
          }).map((s) => (
            <div key={s.id} className="border p-4 mb-4 rounded bg-blue-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{s.code} - {s.name}</h3>
                  <p className="text-sm text-gray-600">📅 {s.date} | 🕒 {s.startTime} - {s.endTime} | 📍 {s.room}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEditSession(s)}
                    className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                  >
                    <Pencil className="w-4 h-4" /> Editar
                  </button>
                  <button
                    disabled={!programPublished}
                    onClick={() => setConfirmDelete({ type: 'session', id: s.id, name: `${s.code} - ${s.name}` })}
                    className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </button>
                </div>
              </div>
              <ul className="ml-4 list-disc">
                {s.works.map((id, index) => {
                  const work = works.find((w: any) => w.id === id);
                  return (
                    <li key={id} className="mb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-medium">{index + 1}. {work?.title}</span>
                          <div className="text-sm text-gray-600">Autor: {getAuthor(work?.userId)}</div>
                          <div className="text-sm text-gray-600">Tipo: {work?.axis}</div>
                        </div>
                        <button
                          onClick={() => removeWorkFromSession(s.id, id)}
                          className="flex items-center gap-1 bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded text-xs hover:bg-red-200 transition shrink-0 mt-0.5"
                        >
                          <X className="w-3 h-3" /> Quitar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* ── MESAS REDONDAS ── */}
          <h3 className="text-xl mt-8 mb-4 text-purple-700">Mesas Redondas</h3>
          {roundTables.length === 0 && <p className="text-gray-500 mb-4">No hay mesas redondas.</p>}
          {[...roundTables].sort((a, b) => {
            const d = a.date.localeCompare(b.date);
            return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
          }).map((m) => (
            <div key={m.id} className="border p-4 mb-4 rounded bg-purple-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{m.title}</h3>
                  <p className="text-sm text-gray-600">📅 {m.date} | 🕒 {m.startTime} - {m.endTime} | 📍 {m.room}</p>
                  <p className="text-sm"><strong>Moderador:</strong> {m.moderator}</p>
                  <p className="text-sm"><strong>Panelistas:</strong> {m.panelists}</p>
                  <p className="text-sm">{m.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEditRoundTable(m)}
                    className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition"
                  >
                    <Pencil className="w-4 h-4" /> Editar
                  </button>
                  <button
                    disabled={!programPublished}
                    onClick={() => setConfirmDelete({ type: 'roundtable', id: m.id, name: m.title })}
                    className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* ── SESIONES DE PÓSTERS ── */}
          <h3 className="text-xl mt-8 mb-4 text-yellow-700">Sesiones de Pósters</h3>
          {posterSessions.length === 0 && <p className="text-gray-500">No hay sesiones de pósters.</p>}
          {[...posterSessions].sort((a, b) => {
            const d = a.date.localeCompare(b.date);
            return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
          }).map((p) => (
            <div key={p.id} className="border p-4 mb-4 rounded bg-yellow-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-sm text-gray-600">📅 {p.date} | 🕒 {p.startTime} - {p.endTime} | 📍 {p.location}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEditPoster(p)}
                    className="flex items-center gap-1 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition"
                  >
                    <Pencil className="w-4 h-4" /> Editar
                  </button>
                  <button
                    disabled={!programPublished}
                    onClick={() => setConfirmDelete({ type: 'poster', id: p.id, name: p.name })}
                    className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </button>
                </div>
              </div>
              <ul className="ml-4 list-disc">
                {p.works.map((w) => {
                  const work = works.find((wk: any) => wk.id === w.workId);
                  return (
                    <li key={w.workId} className="mb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-medium">{work?.title}</span>
                          <div className="text-sm text-gray-600">Autor: {getAuthor(work?.userId)} | Panel: {w.stand}</div>
                          <div className="text-sm text-gray-600">Tipo: {work?.axis}</div>
                        </div>
                        <button
                          onClick={() => removeWorkFromPoster(p.id, w.workId)}
                          className="flex items-center gap-1 bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded text-xs hover:bg-red-200 transition shrink-0 mt-0.5"
                        >
                          <X className="w-3 h-3" /> Quitar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* ── TALLERES (PROGRAMA OFICIAL) ── */}
          <h3 className="text-xl mt-8 mb-4 text-teal-800">Talleres</h3>
          {talleresProgramados.length === 0 && (
            <p className="text-gray-500 mb-4">No hay talleres en el programa. Usá &quot;Crear Taller&quot; para agregar uno.</p>
          )}
          {[...talleresProgramados].sort((a, b) => {
            const d = a.fecha.localeCompare(b.fecha);
            return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
          }).map((t) => (
            <div key={t.id} className="border p-4 mb-4 rounded bg-teal-50">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-semibold">{t.titulo}</h3>
                  <p className="text-sm text-gray-600">
                    📅 {t.fecha} | 🕒 {t.startTime} - {t.endTime} | 📍 {t.room}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Responsable(s):</strong> {t.responsables}
                  </p>
                  {t.descripcion && (
                    <p className="text-sm text-gray-600 mt-1 italic">{t.descripcion}</p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!programPublished}
                  onClick={() => setConfirmDelete({ type: 'workshop', id: t.id, name: t.titulo })}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition shrink-0 ${
                    programPublished ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </div>
          ))}

          {/* ── CONFERENCIAS ── */}
          <h3 className="text-xl mt-8 mb-4 text-indigo-800">Conferencias</h3>
          {conferencias.length === 0 && (
            <p className="text-gray-500 mb-4">
              No hay conferencias en el programa. Usá &quot;Crear Conferencia&quot; para agregar una.
            </p>
          )}
          {[...conferencias].sort((a, b) => {
            const d = a.fecha.localeCompare(b.fecha);
            return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
          }).map((c) => (
            <div key={c.id} className="border p-4 mb-4 rounded bg-indigo-50">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-semibold">{c.titulo}</h3>
                  <p className="text-sm text-gray-600">
                    📅 {c.fecha} | 🕒 {c.startTime} - {c.endTime} | 📍 {c.room}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Conferencista(s):</strong> {c.conferencistas}
                  </p>
                  {c.moderador && (
                    <p className="text-sm text-gray-700">
                      <strong>Moderación:</strong> {c.moderador}
                    </p>
                  )}
                  {c.institucion && (
                    <p className="text-sm text-gray-700">
                      <strong>Institución:</strong> {c.institucion}
                    </p>
                  )}
                  {c.descripcion && (
                    <p className="text-sm text-gray-600 mt-1 italic">{c.descripcion}</p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!programPublished}
                  onClick={() => setConfirmDelete({ type: 'conference', id: c.id, name: c.titulo })}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition shrink-0 ${
                    programPublished ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* NOTIFICACIONES */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-7 h-7 text-indigo-600" />
            <h2 className="text-2xl">Enviar Notificación</h2>
          </div>
          <input
            value={notifForm.title}
            onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
            placeholder="Título"
            className="w-full border p-2 mb-2"
          />
          <textarea
            value={notifForm.message}
            onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
            placeholder="Mensaje"
            className="w-full border p-2 mb-2"
          />
          <select
            value={notifForm.role}
            onChange={(e) => setNotifForm({ ...notifForm, role: e.target.value as any })}
            className="w-full border p-2 mb-2"
          >
            <option value="">Todos</option>
            <option value="asistente">Asistentes</option>
            <option value="autor">Autores</option>
            <option value="evaluador">Evaluadores</option>
          </select>
          <button onClick={handleSendNotification} className="w-full bg-indigo-600 text-white py-2 rounded">
            Enviar
          </button>
          {notifFeedback === 'error' && <p className="text-red-600 mt-2">Completar campos</p>}
          {notifFeedback.startsWith('ok') && <p className="text-green-600 mt-2">Enviado ✔</p>}
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODAL — CONFIRMAR ELIMINACIÓN
      ══════════════════════════════════════════════════════════════ */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 rounded-full p-2">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Confirmar eliminación</h2>
            </div>

            <p className="text-gray-600 mb-2">
              ¿Estás seguro que querés eliminar{' '}
              <span className="font-semibold text-gray-800">"{confirmDelete.name}"</span>?
            </p>

            {/* Mensaje contextual según el tipo */}
            {confirmDelete.type === 'session' && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-5">
                ⚠️ Todos los trabajos asignados a esta mesa volverán al estado <strong>aprobado</strong>.
              </p>
            )}
            {confirmDelete.type === 'poster' && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-5">
                ⚠️ Todos los pósters asignados a esta sesión volverán al estado <strong>aprobado</strong>.
              </p>
            )}
            {confirmDelete.type === 'roundtable' && (
              <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-5">
                Esta acción no afecta ningún trabajo. La mesa redonda se eliminará definitivamente.
              </p>
            )}
            {confirmDelete.type === 'workshop' && (
              <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-5">
                Esta acción eliminará el taller del programa oficial.
              </p>
            )}
            {confirmDelete.type === 'conference' && (
              <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2 mb-5">
                Esta acción eliminará la conferencia del programa oficial.
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL — EDITAR MESA TEMÁTICA
      ══════════════════════════════════════════════════════════════ */}
      {editingSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingSession(null); }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Editar Mesa Temática</h2>
              <button onClick={() => setEditingSession(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>Código</label>
                <input name="code" value={editSessionForm.code}
                  onChange={(e) => setEditSessionForm({ ...editSessionForm, code: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Sala</label>
                <input name="room" value={editSessionForm.room}
                  onChange={(e) => setEditSessionForm({ ...editSessionForm, room: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Nombre</label>
                <input name="name" value={editSessionForm.name}
                  onChange={(e) => setEditSessionForm({ ...editSessionForm, name: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Fecha</label>
                <input type="date" value={editSessionForm.date}
                  onChange={(e) => setEditSessionForm({ ...editSessionForm, date: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Inicio</label>
                  <input type="time" value={editSessionForm.startTime}
                    onChange={(e) => setEditSessionForm({ ...editSessionForm, startTime: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Fin</label>
                  <input type="time" value={editSessionForm.endTime}
                    onChange={(e) => setEditSessionForm({ ...editSessionForm, endTime: e.target.value })}
                    className={inputCls} />
                </div>
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Trabajos asignados</h3>
              {editingSession.works.length === 0
                ? <p className="text-sm text-gray-400 italic">Sin trabajos asignados.</p>
                : (
                  <ul className="divide-y border rounded overflow-hidden">
                    {editingSession.works.map((workId) => {
                      const work = works.find((w: any) => w.id === workId);
                      return (
                        <li key={workId} className="flex justify-between items-center px-3 py-2 bg-gray-50 hover:bg-gray-100">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{work?.title ?? 'Trabajo no encontrado'}</p>
                            <p className="text-xs text-gray-500">{getAuthor(work?.userId)}</p>
                          </div>
                          <button
                            onClick={() => removeWorkFromSession(editingSession.id, workId)}
                            className="flex items-center gap-1 text-xs text-red-600 border border-red-300 bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                          >
                            <X className="w-3 h-3" /> Quitar
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingSession(null)} className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={saveSession} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL — EDITAR SESIÓN DE PÓSTERS
      ══════════════════════════════════════════════════════════════ */}
      {editingPoster && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingPoster(null); }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Editar Sesión de Pósters</h2>
              <button onClick={() => setEditingPoster(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className={labelCls}>Nombre</label>
                <input value={editPosterForm.name}
                  onChange={(e) => setEditPosterForm({ ...editPosterForm, name: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Ubicación</label>
                <input value={editPosterForm.location}
                  onChange={(e) => setEditPosterForm({ ...editPosterForm, location: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Fecha</label>
                <input type="date" value={editPosterForm.date}
                  onChange={(e) => setEditPosterForm({ ...editPosterForm, date: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Inicio</label>
                  <input type="time" value={editPosterForm.startTime}
                    onChange={(e) => setEditPosterForm({ ...editPosterForm, startTime: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Fin</label>
                  <input type="time" value={editPosterForm.endTime}
                    onChange={(e) => setEditPosterForm({ ...editPosterForm, endTime: e.target.value })}
                    className={inputCls} />
                </div>
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Pósters asignados</h3>
              {editingPoster.works.length === 0
                ? <p className="text-sm text-gray-400 italic">Sin pósters asignados.</p>
                : (
                  <ul className="divide-y border rounded overflow-hidden">
                    {editingPoster.works.map((w) => {
                      const work = works.find((wk: any) => wk.id === w.workId);
                      return (
                        <li key={w.workId} className="flex justify-between items-center px-3 py-2 bg-gray-50 hover:bg-gray-100">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{work?.title ?? 'Trabajo no encontrado'}</p>
                            <p className="text-xs text-gray-500">{getAuthor(work?.userId)} | Panel: {w.stand}</p>
                          </div>
                          <button
                            onClick={() => removeWorkFromPoster(editingPoster.id, w.workId)}
                            className="flex items-center gap-1 text-xs text-red-600 border border-red-300 bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                          >
                            <X className="w-3 h-3" /> Quitar
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingPoster(null)} className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={savePoster} className="px-4 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700">
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL — EDITAR MESA REDONDA
      ══════════════════════════════════════════════════════════════ */}
      {editingRoundTable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingRoundTable(null); }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Editar Mesa Redonda</h2>
              <button onClick={() => setEditingRoundTable(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className={labelCls}>Título</label>
                <input value={editRoundTableForm.title}
                  onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, title: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Sala</label>
                <input value={editRoundTableForm.room}
                  onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, room: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Fecha</label>
                <input type="date" value={editRoundTableForm.date}
                  onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, date: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-2 col-span-2">
                <div>
                  <label className={labelCls}>Inicio</label>
                  <input type="time" value={editRoundTableForm.startTime}
                    onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, startTime: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Fin</label>
                  <input type="time" value={editRoundTableForm.endTime}
                    onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, endTime: e.target.value })}
                    className={inputCls} />
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Moderador</label>
                <input value={editRoundTableForm.moderator}
                  onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, moderator: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Panelistas</label>
                <input value={editRoundTableForm.panelists}
                  onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, panelists: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Descripción</label>
                <input value={editRoundTableForm.description}
                  onChange={(e) => setEditRoundTableForm({ ...editRoundTableForm, description: e.target.value })}
                  className={inputCls} />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingRoundTable(null)} className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={saveRoundTable} className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}