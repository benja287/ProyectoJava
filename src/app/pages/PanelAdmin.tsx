import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Settings, Users } from 'lucide-react';

export function PanelAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [approvedWorks, setApprovedWorks] = useState<any[]>([]);
  const [scheduledWorks, setScheduledWorks] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});

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
  // INSCRIPCIONES
  // =========================
  const handleApprove = (userId: string) => {
    const updatedUsers = users.map((u: any) =>
      u.id === userId
        ? {
            ...u,
            inscriptionStatus: 'confirmed',
            roles: [...(u.roles || []), 'asistente'],
            currentRole: 'asistente'
          }
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
  // EVALUADORES
  // =========================
  const makeEvaluator = (userId: string) => {
    const updatedUsers = users.map((u: any) => {
      if (u.id === userId && !u.roles?.includes('evaluador')) {
        return {
          ...u,
          roles: [...(u.roles || []), 'evaluador']
        };
      }
      return u;
    });

    localStorage.setItem('congress_users', JSON.stringify(updatedUsers));

    const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');

    if (currentUser.id === userId) {
      localStorage.setItem(
        'current_user',
        JSON.stringify({
          ...currentUser,
          roles: [...(currentUser.roles || []), 'evaluador']
        })
      );
      window.location.reload();
    }

    setUsers(updatedUsers);
  };

  // =========================
  // CRONOGRAMA
  // =========================
  const handleChange = (id: string, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const asignarHorario = (id: string) => {
    const data = formData[id];

    if (!data?.fecha || !data?.hora || !data?.sala) {
      alert('Completar todos los campos');
      return;
    }

    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');

    const updated = allWorks.map((w: any) =>
      w.id === id
        ? { ...w, ...data, status: 'scheduled' } // 🔥 CLAVE
        : w
    );

    localStorage.setItem('congress_works', JSON.stringify(updated));

    // 🔄 refrescar listas
    setApprovedWorks(updated.filter((w: any) => w.status === 'approved'));
    setScheduledWorks(updated.filter((w: any) => w.status === 'scheduled'));

    alert('Cronograma asignado');
  };

  // =========================
  // UI
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

        {/* INSCRIPCIONES */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl mb-6">Validación de Inscripciones</h2>

          {inscriptions.length === 0 ? (
            <p className="text-gray-500">No hay pendientes</p>
          ) : (
            inscriptions.map((i) => (
              <div key={i.id} className="flex justify-between border p-3 mb-2 rounded">
                <div>{i.name} {i.lastName}</div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(i.id)} className="bg-green-600 text-white px-2 py-1 rounded">
                    Aprobar
                  </button>
                  <button onClick={() => handleReject(i.id)} className="bg-red-600 text-white px-2 py-1 rounded">
                    Rechazar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* EVALUADORES */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl mb-6">Asignar Evaluadores</h2>

          {users.map((u) => (
            <div key={u.id} className="flex justify-between items-center border p-3 mb-2 rounded">

              <div>
                <p className="font-medium">{u.name} {u.lastName}</p>
                <p className="text-sm text-gray-500">{u.email}</p>

                <div className="flex gap-2 mt-1 flex-wrap">
                  {u.roles?.map((role: string) => (
                    <span key={role} className="text-xs px-2 py-1 rounded bg-gray-200">
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {!u.roles?.includes('evaluador') ? (
                <button
                  onClick={() => makeEvaluator(u.id)}
                  className="bg-purple-600 text-white px-2 py-1 rounded"
                >
                  Hacer evaluador
                </button>
              ) : (
                <span className="text-green-600">✔ Evaluador</span>
              )}

            </div>
          ))}
        </div>

        {/* 🟡 PENDIENTES */}
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

                <button
                  onClick={() => asignarHorario(w.id)}
                  className="mt-2 bg-indigo-600 text-white px-3 py-1 rounded"
                >
                  Programar
                </button>

              </div>
            ))
          )}
        </div>

        {/* 🟢 PROGRAMADOS */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl mb-6">Cronograma armado</h2>

          {scheduledWorks.length === 0 ? (
            <p className="text-gray-500">No hay trabajos programados</p>
          ) : (
            scheduledWorks.map((w) => (
              <div key={w.id} className="border p-4 mb-3 rounded bg-green-50">

                <h3 className="font-semibold">{w.title}</h3>
                <p className="text-sm text-gray-600">
                  📅 {w.fecha} | 🕒 {w.hora} | 📍 {w.sala}
                </p>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}