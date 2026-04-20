import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function AdminMesasRedondas() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    axis: '',
    moderator: '',
    panelists: '',
    description: '',
    place: '',
    date: '',
    start: '',
    end: '',
  });

  useEffect(() => {
    if (!user || user.currentRole !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = () => {
    if (!form.title || !form.moderator) {
      alert('Completar campos obligatorios');
      return;
    }

    const mesas = JSON.parse(localStorage.getItem('congress_roundtables') || '[]');

    mesas.push({
        id: Date.now().toString(),
        title: form.title,
        axis: form.axis,
        moderator: form.moderator,
        panelists: form.panelists.split(',').map(p => p.trim()),
        description: form.description,
      
        // 🔥 UNIFICADO
        room: form.place,
        date: form.start.split('T')[0],
        startTime: form.start.split('T')[1],
        endTime: form.end.split('T')[1],
      });
    localStorage.setItem('congress_roundtables', JSON.stringify(mesas));

    alert('Mesa redonda creada');

    navigate('/admin');
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl mb-6">Crear Mesa Redonda</h1>

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

        <input
          type="datetime-local"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, start: e.target.value })}
        />

        <input
          type="datetime-local"
          className="border p-2 rounded"
          onChange={(e) => setForm({ ...form, end: e.target.value })}
        />
      </div>

      <button
        onClick={handleSubmit}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        Crear Mesa Redonda
      </button>
    </div>
  );
}