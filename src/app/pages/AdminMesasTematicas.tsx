import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function AdminMesasTematicas() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [approvedWorks, setApprovedWorks] = useState<any[]>([]);
  const [selectedWorks, setSelectedWorks] = useState<string[]>([]);

  const [form, setForm] = useState({
    code: '',
    name: '',
    room: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    if (!user || user.currentRole !== 'admin') {
      navigate('/');
      return;
    }

    const works = JSON.parse(localStorage.getItem('congress_works') || '[]');

    const approved = works.filter(
      (w: any) => w.status === 'approved' && w.type === 'oral'
    );

    setApprovedWorks(approved);
  }, [user, navigate]);

  const toggleWork = (id: string) => {
    setSelectedWorks((prev) =>
      prev.includes(id)
        ? prev.filter((w) => w !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (
      !form.code ||
      !form.name ||
      !form.room ||
      !form.date ||
      !form.startTime ||
      !form.endTime ||
      selectedWorks.length === 0
    ) {
      alert('Completar todos los campos');
      return;
    }

    // 🔹 1. GUARDAR LA MESA
    const sesiones = JSON.parse(localStorage.getItem('congress_sessions') || '[]');

    sesiones.push({
      id: Date.now().toString(),
      type: 'tematica', // 🔥 importante para diferenciar
      code: form.code,
      name: form.name,
      works: selectedWorks,
      room: form.room,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
    });

    localStorage.setItem('congress_sessions', JSON.stringify(sesiones));

    // 🔥 2. ACTUALIZAR ESTADO DE LOS TRABAJOS
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');

    const updatedWorks = allWorks.map((w: any) =>
      selectedWorks.includes(w.id)
        ? { ...w, status: 'scheduled' }
        : w
    );

    localStorage.setItem('congress_works', JSON.stringify(updatedWorks));

    // 🔹 3. FEEDBACK
    alert('Mesa temática creada correctamente');

    navigate('/admin');
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-6">Crear Mesa Temática</h1>

      {/* FORM */}
      <div className="grid gap-4 mb-6">
        <input
          placeholder="Código (SO 15)"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, code: e.target.value })}
        />

        <input
          placeholder="Nombre de la sesión"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Sala"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, room: e.target.value })}
        />

        <input
          type="date"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        {/* 🔥 NUEVO */}
        <input
          type="time"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
        />

        <input
          type="time"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, endTime: e.target.value })}
        />
      </div>

      {/* LISTA DE TRABAJOS */}
      <h2 className="text-xl mb-4">Seleccionar trabajos aprobados</h2>

      <div className="space-y-2 mb-6">
        {approvedWorks.map((w) => (
          <label key={w.id} className="flex gap-2 border p-2 rounded">
            <input
              type="checkbox"
              checked={selectedWorks.includes(w.id)}
              onChange={() => toggleWork(w.id)}
            />
            <span>
              {w.title}
              <span className="text-xs text-gray-500 ml-2">
                ({w.axis} - {w.type})
              </span>
            </span>
          </label>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Crear Mesa
      </button>
    </div>
  );
}