import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../context/AuthContext';
import {
  CONFERENCIAS_KEY,
  CONGRESS_EVENT_DATES,
  congressDateLabels,
  isCongressDate,
  isValidTimeRange,
  hasTimeOverlap,
} from '../../../constants/congressEvent';

export interface ConferenciaPrograma {
  id: string;
  titulo: string;
  fecha: string;
  startTime: string;
  endTime: string;
  room: string;
  conferencistas: string;
  moderador?: string;
  institucion?: string;
  descripcion?: string;
}

export function AdminCrearConferencia() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [form, setForm] = useState<{
    titulo: string;
    fecha: string;
    startTime: string;
    endTime: string;
    room: string;
    conferencistas: string;
    moderador: string;
    institucion: string;
    descripcion: string;
  }>({
    titulo: '',
    fecha: CONGRESS_EVENT_DATES[0],
    startTime: '09:00',
    endTime: '10:00',
    room: '',
    conferencistas: '',
    moderador: '',
    institucion: '',
    descripcion: '',
  });

  useEffect(() => {
    if (!user || user.currentRole !== 'admin') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  if (!user || user.currentRole !== 'admin') return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const titulo = form.titulo.trim();
    const room = form.room.trim();
    const conferencistas = form.conferencistas.trim();

    if (!titulo || !room || !conferencistas) {
      setError('Completá título, lugar/espacio y conferencista(s).');
      return;
    }
    if (!isCongressDate(form.fecha)) {
      setError('La fecha seleccionada no es válida para este congreso.');
      return;
    }
    if (!isValidTimeRange(form.startTime, form.endTime)) {
      setError('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    const list: ConferenciaPrograma[] = JSON.parse(localStorage.getItem(CONFERENCIAS_KEY) || '[]');
    if (hasTimeOverlap(list, form.fecha, form.startTime, form.endTime)) {
      setError('Ya existe una conferencia en ese horario. Elegí otro horario.');
      return;
    }
    const nuevo: ConferenciaPrograma = {
      id: Date.now().toString(),
      titulo,
      fecha: form.fecha,
      startTime: form.startTime,
      endTime: form.endTime,
      room,
      conferencistas,
      moderador: form.moderador.trim() || undefined,
      institucion: form.institucion.trim() || undefined,
      descripcion: form.descripcion.trim() || undefined,
    };

    localStorage.setItem(CONFERENCIAS_KEY, JSON.stringify([...list, nuevo]));
    navigate('/admin', { state: { conferenciaCreada: true } });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl mb-2">Crear Conferencia (programa oficial)</h1>
          <p className="text-sm text-gray-600 mb-6">
            Fechas permitidas: {CONGRESS_EVENT_DATES.join(', ')}. Horarios validados automáticamente.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-200 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Título</label>
              <input
                required
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Título de la conferencia"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha</label>
              <select
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                {congressDateLabels().map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Hora inicio</label>
                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Hora fin</label>
                <input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Lugar / espacio</label>
              <input
                required
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Ej. Aula Magna — FCAyF"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Conferencista(s)</label>
              <input
                required
                value={form.conferencistas}
                onChange={(e) => setForm({ ...form, conferencistas: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Nombre(s) y apellido(s)"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Moderador/a (opcional)</label>
                <input
                  value={form.moderador}
                  onChange={(e) => setForm({ ...form, moderador: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Nombre"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Institución (opcional)</label>
                <input
                  value={form.institucion}
                  onChange={(e) => setForm({ ...form, institucion: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="UNLP, INTA, etc."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Descripción / resumen (opcional)</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={4}
                className="w-full border rounded px-3 py-2 resize-y min-h-[100px]"
                placeholder="Detalle para mostrar en el programa"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-indigo-700 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-800 transition"
              >
                Guardar conferencia
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-6 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

