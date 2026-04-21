import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  CONGRESS_EVENT_DATES,
  congressDateLabels,
  isCongressDate,
  isValidTimeRange,
  hasTimeOverlap,
} from '../constants/congressEvent';

export function AdminPosters() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [approvedWorks, setApprovedWorks] = useState<any[]>([]);
  const [selectedWorks, setSelectedWorks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    name: string;
    location: string;
    date: string;
    startTime: string;
    endTime: string;
  }>({
    name: '',
    location: '',
    date: CONGRESS_EVENT_DATES[0],
    startTime: '09:00',
    endTime: '11:00',
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
    setError(null);
    if (
      !form.name ||
      !form.location ||
      !form.date ||
      !form.startTime ||
      !form.endTime ||
      selectedWorks.length === 0
    ) {
      setError('Completá todos los campos obligatorios y seleccioná al menos un póster.');
      return;
    }

    if (!isCongressDate(form.date)) {
      setError('La fecha seleccionada no es válida para este congreso.');
      return;
    }
    if (!isValidTimeRange(form.startTime, form.endTime)) {
      setError('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    const sesionesExistentes = JSON.parse(localStorage.getItem('congress_posters') || '[]');
    if (hasTimeOverlap(sesionesExistentes, form.date, form.startTime, form.endTime)) {
      setError('Ya existe una sesión de pósters en ese horario. Elegí otro horario.');
      return;
    }

    const sesiones = sesionesExistentes;

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
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}
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

        <select
          value={form.date}
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        >
          {congressDateLabels().map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <input
          type="time"
          className="border p-2 rounded"
          value={form.startTime}
          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
        />

        <input
          type="time"
          className="border p-2 rounded"
          value={form.endTime}
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

      <div className="flex gap-3 mt-4">
        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Crear Sesión
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="border px-4 py-2 rounded text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}