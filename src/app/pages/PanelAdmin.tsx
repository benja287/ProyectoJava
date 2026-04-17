import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Settings, Users, Bell } from 'lucide-react'; // NUEVO: ícono Bell para la sección
import { UserRole } from '../context/AuthContext'; // NUEVO: importamos el tipo para el selector de rol

export function PanelAdmin() {
  const { user, sendNotificationToAll } = useAuth(); // NUEVO: traemos sendNotificationToAll
  const navigate = useNavigate();

  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [approvedWorks, setApprovedWorks] = useState<any[]>([]);
  const [scheduledWorks, setScheduledWorks] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});

  // NUEVO: estado para el formulario de notificaciones
  const [notifForm, setNotifForm] = useState({
    title: '',
    message: '',
    role: '' as UserRole | '', // vacío significa "todos"
  });
  // NUEVO: mensaje de feedback al admin después de enviar
  const [notifFeedback, setNotifFeedback] = useState('');

  useEffect(() => {
    if (!user || user.currentRole !== 'admin') {
      navigate('/');
      return;
    }

    const allUsers = JSON.parse(localStorage.getItem('congress_users') || '[]');
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');

    const pending = allUsers.filter((u: any) => u.inscriptionStatus === 'pending');
    const approved = allWorks.filter((w: any) => w.status === 'approved');
    const scheduled = allWorks.filter((w: any) => w.status === 'scheduled');

    setInscriptions(pending);
    setUsers(allUsers);
    setApprovedWorks(approved);
    setScheduledWorks(scheduled);
  }, [user, navigate]);

  if (!user) return null;

  // =========================
  // INSCRIPCIONES — sin cambios
  // =========================
  const handleApprove = (userId: string) => {
    const updatedUsers = users.map((u: any) =>
      u.id === userId
        ? { ...u, inscriptionStatus: 'confirmed', roles: [...(u.roles || []), 'asistente'], currentRole: 'asistente' }
        : u
    );
    localStorage.setItem('congress_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setInscriptions(inscriptions.filter(i => i.id !== userId));
  };

  const handleReject = (userId: string) => {
    const updatedUsers = users.map((u: any) =>
      u.id === userId ? { ...u, inscriptionStatus: 'rejected' } : u
    );
    localStorage.setItem('congress_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setInscriptions(inscriptions.filter(i => i.id !== userId));
  };

  // =========================
  // EVALUADORES — sin cambios
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
      localStorage.setItem('current_user', JSON.stringify({ ...currentUser, roles: [...(currentUser.roles || []), 'evaluador'] }));
      window.location.reload();
    }
    setUsers(updatedUsers);
  };

  // =========================
  // CRONOGRAMA — sin cambios
  // =========================
  const handleChange = (id: string, field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const asignarHorario = (id: string) => {
    const data = formData[id];
    if (!data?.fecha || !data?.hora || !data?.sala) {
      alert('Completar todos los campos');
      return;
    }
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const updated = allWorks.map((w: any) =>
      w.id === id ? { ...w, ...data, status: 'scheduled' } : w
    );
    localStorage.setItem('congress_works', JSON.stringify(updated));
    setApprovedWorks(updated.filter((w: any) => w.status === 'approved'));
    setScheduledWorks(updated.filter((w: any) => w.status === 'scheduled'));
    alert('Cronograma asignado');
  };

  // =========================
  // NUEVO: NOTIFICACIONES
  // =========================
  const handleSendNotification = () => {
    // Escenario 3 HU-18: campos obligatorios vacíos
    if (!notifForm.title.trim() || !notifForm.message.trim()) {
      setNotifFeedback('error');
      return;
    }

    // Escenario 1 (todos) y Escenario 2 (por rol) HU-18
    // si notifForm.role está vacío se manda a todos, si tiene valor se filtra por ese rol
    const count = sendNotificationToAll(
      notifForm.title.trim(),
      notifForm.message.trim(),
      notifForm.role || undefined
    );

    // Limpia el formulario y muestra confirmación
    setNotifForm({ title: '', message: '', role: '' });
    setNotifFeedback(`ok:${count}`); // guardamos cuántos recibieron para mostrarlo
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-6xl">

        {/* HEADER — sin cambios */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4">
            <Settings className="w-12 h-12" />
            <div>
              <h1 className="text-4xl">Panel de Administración</h1>
              <p className="text-indigo-100 mt-2">Gestión completa del congreso</p>
            </div>
          </div>
        </div>

        {/* INSCRIPCIONES — sin cambios */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl mb-6">Validación de Inscripciones</h2>
          {inscriptions.length === 0 ? (
            <p className="text-gray-500">No hay pendientes</p>
          ) : (
            inscriptions.map((i) => (
              <div key={i.id} className="flex justify-between border p-3 mb-2 rounded">
                <div>{i.name} {i.lastName}</div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(i.id)} className="bg-green-600 text-white px-2 py-1 rounded">Aprobar</button>
                  <button onClick={() => handleReject(i.id)} className="bg-red-600 text-white px-2 py-1 rounded">Rechazar</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* EVALUADORES — sin cambios */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl mb-6">Asignar Evaluadores</h2>
          {users.map((u) => (
            <div key={u.id} className="flex justify-between items-center border p-3 mb-2 rounded">
              <div>
                <p className="font-medium">{u.name} {u.lastName}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {u.roles?.map((role: string) => (
                    <span key={role} className="text-xs px-2 py-1 rounded bg-gray-200">{role}</span>
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

        {/* CRONOGRAMA PENDIENTE — sin cambios */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl mb-6">Trabajos aprobados (sin programar)</h2>
          {approvedWorks.length === 0 ? (
            <p className="text-gray-500">No hay trabajos pendientes</p>
          ) : (
            approvedWorks.map((w) => (
              <div key={w.id} className="border p-4 mb-4 rounded">
                <h3 className="font-semibold mb-2">{w.title}</h3>
                <div className="grid md:grid-cols-3 gap-2">
                  <input type="date" onChange={(e) => handleChange(w.id, 'fecha', e.target.value)} className="border p-2 rounded" />
                  <input type="text" placeholder="Hora" onChange={(e) => handleChange(w.id, 'hora', e.target.value)} className="border p-2 rounded" />
                  <input type="text" placeholder="Sala" onChange={(e) => handleChange(w.id, 'sala', e.target.value)} className="border p-2 rounded" />
                </div>
                <button onClick={() => asignarHorario(w.id)} className="mt-2 bg-indigo-600 text-white px-3 py-1 rounded">
                  Programar
                </button>
              </div>
            ))
          )}
        </div>

        {/* CRONOGRAMA ARMADO — sin cambios */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl mb-6">Cronograma armado</h2>
          {scheduledWorks.length === 0 ? (
            <p className="text-gray-500">No hay trabajos programados</p>
          ) : (
            scheduledWorks.map((w) => (
              <div key={w.id} className="border p-4 mb-3 rounded bg-green-50">
                <h3 className="font-semibold">{w.title}</h3>
                <p className="text-sm text-gray-600">📅 {w.fecha} | 🕒 {w.hora} | 📍 {w.sala}</p>
              </div>
            ))
          )}
        </div>

        {/* NUEVO: SECCIÓN NOTIFICACIONES — implementa HU-18 */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-7 h-7 text-indigo-600" />
            <h2 className="text-2xl">Enviar Notificación</h2>
          </div>

          <div className="space-y-4">

            {/* Título de la notificación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={notifForm.title}
                onChange={(e) => {
                  setNotifForm(prev => ({ ...prev, title: e.target.value }));
                  setNotifFeedback(''); // limpia feedback al editar
                }}
                placeholder="Ej: Cambio de sala en mesa temática"
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
              <textarea
                value={notifForm.message}
                onChange={(e) => {
                  setNotifForm(prev => ({ ...prev, message: e.target.value }));
                  setNotifFeedback('');
                }}
                placeholder="Escribí el contenido del aviso..."
                rows={4}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Selector de destinatarios — Escenario 1 y 2 de HU-18 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destinatarios</label>
              <select
                value={notifForm.role}
                onChange={(e) => setNotifForm(prev => ({ ...prev, role: e.target.value as UserRole | '' }))}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {/* valor vacío = todos los usuarios — Escenario 1 */}
                <option value="">Todos los usuarios</option>
                {/* valores específicos — Escenario 2 */}
                <option value="asistente">Asistentes</option>
                <option value="autor">Autores</option>
                <option value="evaluador">Evaluadores</option>
              </select>
            </div>

            {/* Botón enviar */}
            <button
              onClick={handleSendNotification}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Enviar notificación
            </button>

            {/* Feedback al admin después de enviar */}
            {notifFeedback === 'error' && (
              // Escenario 3 HU-18: campos vacíos
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                El título y el mensaje son obligatorios.
              </div>
            )}
            {notifFeedback.startsWith('ok') && (
              // Escenario 1 y 2 HU-18: envío exitoso
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                La notificación fue enviada correctamente a {notifFeedback.split(':')[1]} usuario/s.
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}