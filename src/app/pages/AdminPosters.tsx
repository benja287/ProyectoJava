import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function AdminPosters() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [approvedWorks, setApprovedWorks] = useState<any[]>([]);
  const [selectedWorks, setSelectedWorks] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: '',
    location: '',
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

    const posters = works.filter(
      (w: any) => w.status === 'approved' && w.type === 'poster'
    );

    setApprovedWorks(posters);
  }, [user, navigate]);

  const toggleWork = (workId: string) => {
    setSelectedWorks((prev) => {
      const exists = prev.find((w: any) => w.workId === workId);

      if (exists) {
        return prev.filter((w: any) => w.workId !== workId);
      } else {
        return [...prev, { workId, panel: '' }];
      }
    });
  };

  const setPanel = (workId: string, panel: string) => {
    setSelectedWorks((prev) =>
      prev.map((w: any) =>
        w.workId === workId ? { ...w, panel } : w
      )
    );
  };

  const handleSubmit = () => {
    if (
      !form.name ||
      !form.location ||
      !form.date ||
      !form.startTime ||
      !form.endTime ||
      selectedWorks.length === 0
    ) {
      alert('Completar todos los campos');
      return;
    }

    const sesiones = JSON.parse(localStorage.getItem('congress_posters') || '[]');

    sesiones.push({
      id: Date.now().toString(),
      ...form,
      works: selectedWorks,
    });

    localStorage.setItem('congress_posters', JSON.stringify(sesiones));

    // 🔥 actualizar estado de trabajos
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');

    const updated = allWorks.map((w: any) =>
      selectedWorks.some(sw => sw.workId === w.id)
        ? { ...w, status: 'scheduled' }
        : w
    );

    localStorage.setItem('congress_works', JSON.stringify(updated));

    alert('Sesión de pósters creada correctamente');
    navigate('/admin');
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-6">Crear Sesión de Pósters</h1>

      {/* FORM */}
      <div className="grid gap-4 mb-6">
        <input
          placeholder="Nombre de la sesión"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Ubicación (Hall, Patio, etc.)"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />

        <input
          type="date"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

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

      {/* LISTA */}
      <h2 className="text-xl mb-4">Seleccionar pósters</h2>

      {approvedWorks.map((w) => {
        const selected = selectedWorks.find(sw => sw.workId === w.id);

        return (
          <div key={w.id} className="border p-3 rounded mb-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!selected}
                onChange={() => toggleWork(w.id)}
              />
              {w.title}
            </label>

            {selected && (
              <input
                placeholder="Panel (Ej: Panel 01)"
                className="border p-1 mt-2 rounded"
                onChange={(e) => setPanel(w.id, e.target.value)}
              />
            )}
          </div>
        );
      })}

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-4 py-2 rounded mt-4"
      >
        Crear Sesión
      </button>
    </div>
  );
}