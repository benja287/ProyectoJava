import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';

export function EnvioTrabajosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    axis: '',
    type: '',
    file: null as File | null,
  });

  const [myWorks, setMyWorks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const userWorks = allWorks.filter((w: any) => w.userId === user.id);
    setMyWorks(userWorks);

  }, [user, navigate]);

  if (!user) return null;

  // 🔥 VALIDACIONES MEJORADAS
  const canSubmit = () => {

    // trabajos activos (no rechazados)
    const activeWorks = myWorks.filter(w => w.status !== 'rejected');

    // trabajos rechazados con intentos disponibles
    const rejectedWithAttempts = myWorks.filter(
      w => w.status === 'rejected' && (w.attempts || 1) < 3
    );

    // 🔹 ASISTENTE → solo 1 trabajo activo
    if (user.currentRole === 'asistente') {
      return activeWorks.length < 1 || rejectedWithAttempts.length > 0;
    }

    // 🔹 AUTOR → máximo 2 trabajos activos
    if (user.currentRole === 'autor') {
      return activeWorks.length < 2 || rejectedWithAttempts.length > 0;
    }

    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!canSubmit()) {
      setError('No puedes enviar más trabajos según tu rol.');
      return;
    }

    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');

    // 🔥 BUSCAR SI HAY UNO RECHAZADO PARA REINTENTO
    const rejectedWork = myWorks.find(
      w => w.status === 'rejected' && (w.attempts || 1) < 3
    );

    let updatedWorks;

    if (rejectedWork) {
      // 🔁 REENVÍO (NO crea uno nuevo)
      updatedWorks = allWorks.map((w: any) =>
        w.id === rejectedWork.id
          ? {
              ...w,
              title: formData.title,
              axis: formData.axis,
              type: formData.type,
              status: 'pending',
              attempts: (w.attempts || 1) + 1
            }
          : w
      );
    } else {
      // 🆕 NUEVO TRABAJO
      const newWork = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name + ' ' + user.lastName,
        title: formData.title,
        axis: formData.axis,
        type: formData.type,

        status: 'pending',
        attempts: 1,

        // 🔥 LO MANEJA EL ADMIN
        fecha: null,
        hora: null,
        sala: null,
      };

      updatedWorks = [...allWorks, newWork];
    }

    localStorage.setItem('congress_works', JSON.stringify(updatedWorks));

    setSubmitted(true);
  };

  // ✅ SUCCESS
  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <CheckCircle className="w-16 h-16 text-[#2d5016] mx-auto mb-4" />
          <h2 className="text-2xl">Trabajo enviado</h2>
          <p className="text-gray-600">En evaluación</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg p-8">

          <h1 className="text-3xl mb-4">Envío de Trabajos</h1>

          <div className="mb-4 text-sm text-gray-600">
            Trabajos enviados: {myWorks.length}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {!canSubmit() ? (
            <div className="text-center text-gray-500">
              No puedes enviar más trabajos.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              <input
                type="text"
                placeholder="Título"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border p-2 rounded"
              />

              <select
                required
                value={formData.axis}
                onChange={(e) => setFormData({ ...formData, axis: e.target.value })}
                className="w-full border p-2 rounded"
              >
                <option value="">Eje temático</option>
                <option value="Relato de experiencia">Relato de experiencia</option>
                <option value="Trabajo cientifico">Trabajo cientifico</option>
              </select>

              <div>
                <label>
                  <input
                    type="radio"
                    value="oral"
                    checked={formData.type === 'oral'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  /> Oral
                </label>

                <label className="ml-4">
                  <input
                    type="radio"
                    value="poster"
                    checked={formData.type === 'poster'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  /> Poster
                </label>
              </div>

              <input
                type="file"
                required
                accept=".pdf"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
              />

              <button className="w-full bg-[#2d5016] text-white py-2 rounded">
                Enviar trabajo
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}