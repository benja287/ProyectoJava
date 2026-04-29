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

export function AdminMesasTematicas() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [approvedWorks, setApprovedWorks] = useState<any[]>([]);
  const [selectedWorks, setSelectedWorks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    code: string;
    name: string;
    room: string;
    date: string;
    startTime: string;
    endTime: string;
  }>({
    code: '',
    name: '',
    room: '',
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

    const approved = works.filter((w: any) => {
      const modality = w.modality ?? w.type; // compatibilidad
      return w.status === 'approved' && modality === 'oral';
    });

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
    setError(null);

    if (
      !form.code ||
      !form.name ||
      !form.room ||
      !form.date ||
      !form.startTime ||
      !form.endTime ||
      selectedWorks.length === 0
    ) {
      setError('Completá todos los campos obligatorios y seleccioná al menos un trabajo.');
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

    const sesionesExistentes = JSON.parse(localStorage.getItem('congress_sessions') || '[]');
    if (hasTimeOverlap(sesionesExistentes, form.date, form.startTime, form.endTime)) {
      setError('Ya existe una mesa temática en ese horario. Elegí otro horario.');
      return;
    }

    // 🔹 1. GUARDAR LA MESA
    const sesiones = sesionesExistentes;

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
          placeholder="Código (SO 15)"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, code: e.target.value })}
        />

        <input
          placeholder="Descripcion de la sesión"
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
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          list="congressDates"
        />
        <datalist id="congressDates">
          {congressDateLabels().map((o) => (
            <option key={o.value} value={o.value} />
          ))}
        </datalist>

        {/* 🔥 NUEVO */}
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
                ({w.axis} - {(w.modality ?? w.type) || '—'}{w.workType ? ` - ${w.workType}` : ''})
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Crear Mesa
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