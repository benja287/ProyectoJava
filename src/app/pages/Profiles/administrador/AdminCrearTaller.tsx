import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../context/AuthContext';
import {
  CONGRESS_EVENT_DATES,
  TALLERES_PROGRAMADOS_KEY,
  congressDateLabels,
  isCongressDate,
  isValidTimeRange,
  hasTimeOverlap,
} from '../../../constants/congressEvent';

const PROGRAM_KEY = TALLERES_PROGRAMADOS_KEY;
const PROPUESTAS_KEY = 'congress_talleres_propuestos';

export interface TallerProgramado {
  id: string;
  titulo: string;
  fecha: string;
  startTime: string;
  endTime: string;
  room: string;
  responsables: string;
  descripcion?: string;
  proposalId?: string | null;
}

export function AdminCrearTaller() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [proposalId, setProposalId] = useState('');
  const [approvedList, setApprovedList] = useState<any[]>([]);

  const [form, setForm] = useState<{
    titulo: string;
    fecha: string;
    startTime: string;
    endTime: string;
    room: string;
    responsables: string;
    descripcion: string;
  }>({
    titulo: '',
    fecha: CONGRESS_EVENT_DATES[0],
    startTime: '09:00',
    endTime: '11:00',
    room: '',
    responsables: '',
    descripcion: '',
  });

  useEffect(() => {
    if (!user || user.currentRole !== 'admin') {
      navigate('/');
      return;
    }
    const raw = JSON.parse(localStorage.getItem(PROPUESTAS_KEY) || '[]');
    setApprovedList(raw.filter((t: any) => t.status === 'approved'));
  }, [user, navigate]);

  if (!user || user.currentRole !== 'admin') return null;

  const applyProposal = (id: string) => {
    setProposalId(id);
    if (!id) return;
    const raw = JSON.parse(localStorage.getItem(PROPUESTAS_KEY) || '[]');
    const p = raw.find((t: any) => t.id === id);
    if (!p) return;
    setForm((prev) => ({
      ...prev,
      titulo: p.titulo || prev.titulo,
      descripcion: [p.descripcion, p.metodologia].filter(Boolean).join('\n\n') || prev.descripcion,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const titulo = form.titulo.trim();
    const room = form.room.trim();
    const responsables = form.responsables.trim();

    if (!titulo || !room || !responsables) {
      setError('Completá título, lugar y responsable(s) del taller.');
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

    const list: TallerProgramado[] = JSON.parse(localStorage.getItem(PROGRAM_KEY) || '[]');
    if (hasTimeOverlap(list, form.fecha, form.startTime, form.endTime)) {
      setError('Ya existe un taller en ese horario. Elegí otro horario.');
      return;
    }
    const nuevo: TallerProgramado = {
      id: Date.now().toString(),
      titulo,
      fecha: form.fecha,
      startTime: form.startTime,
      endTime: form.endTime,
      room,
      responsables,
      descripcion: form.descripcion.trim() || undefined,
      proposalId: proposalId || undefined,
    };

    localStorage.setItem(PROGRAM_KEY, JSON.stringify([...list, nuevo]));
    navigate('/admin', { state: { tallerCreado: true } });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl mb-2">Crear Taller (programa oficial)</h1>
          <p className="text-sm text-gray-600 mb-6">
            Fechas permitidas: {CONGRESS_EVENT_DATES.join(', ')}. Horarios validados automáticamente.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-200 rounded text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {approvedList.length > 0 && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Vincular propuesta aprobada (opcional)
                </label>
                <select
                  value={proposalId}
                  onChange={(e) => applyProposal(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">— Sin vincular —</option>
                  {approvedList.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.titulo}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-1">Título</label>
              <input
                required
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Título del taller"
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
                placeholder="Ej. Aula 5 — FCAyF"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Responsable(s) / moderación</label>
              <input
                required
                value={form.responsables}
                onChange={(e) => setForm({ ...form, responsables: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Nombres del equipo o moderador/a"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Descripción (opcional)</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={4}
                className="w-full border rounded px-3 py-2 resize-y min-h-[100px]"
                placeholder="Objetivos o detalle para el programa público"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-teal-700 text-white py-2.5 rounded-lg font-medium hover:bg-teal-800 transition"
              >
                Guardar taller
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
