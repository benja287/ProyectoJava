import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  CONGRESS_EVENT_DATES,
  congressDateLabels,
  isCongressDate,
  isValidTimeRange,
  hasTimeOverlap,
} from '../constants/congressEvent';

export function AdminMesasRedondas() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    title: string;
    axis: string;
    moderator: string;
    panelists: string;
    description: string;
    place: string;
    date: string;
    startTime: string;
    endTime: string;
  }>({
    title: '',
    axis: '',
    moderator: '',
    panelists: '',
    description: '',
    place: '',
    date: CONGRESS_EVENT_DATES[0],
    startTime: '09:00',
    endTime: '10:00',
  });

  useEffect(() => {
    if (!user || user.currentRole !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = () => {
    setError(null);
    if (!form.title || !form.moderator || !form.place || !form.date || !form.startTime || !form.endTime) {
      setError('Completá los campos obligatorios.');
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

    const mesasExistentes = JSON.parse(localStorage.getItem('congress_roundtables') || '[]');
    if (hasTimeOverlap(mesasExistentes, form.date, form.startTime, form.endTime)) {
      setError('Ya existe una mesa redonda en ese horario. Elegí otro horario.');
      return;
    }

    const mesas = mesasExistentes;

    mesas.push({
        id: Date.now().toString(),
        title: form.title,
        axis: form.axis,
        moderator: form.moderator,
        panelists: form.panelists.split(',').map(p => p.trim()),
        description: form.description,
      
        // 🔥 UNIFICADO
        room: form.place,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
      });
    localStorage.setItem('congress_roundtables', JSON.stringify(mesas));

    alert('Mesa redonda creada');

    navigate('/admin');
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-6">Crear Mesa Redonda</h1>

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
          placeholder="Título"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <input
          placeholder="Eje temático"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, axis: e.target.value })}
        />

        <input
          placeholder="Moderador"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, moderator: e.target.value })}
        />

        <input
          placeholder="Panelistas (separados por coma)"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, panelists: e.target.value })}
        />

        <textarea
          placeholder="Descripción"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <input
          placeholder="Lugar"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, place: e.target.value })}
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

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Crear Mesa Redonda
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