import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { CheckCircle } from 'lucide-react';

const TALLERES_KEY = 'congress_talleres_propuestos';

export function ProponerTallerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    metodologia: '',
    file: null as File | null,
  });

  const isAsistente = user?.roles?.includes('asistente');
  const talleresMine = user
    ? JSON.parse(localStorage.getItem(TALLERES_KEY) || '[]').filter(
        (t: { userId: string }) => t.userId === user.id
      )
    : [];
  const tienePropuestaActiva = talleresMine.some(
    (t: { status: string }) => t.status === 'pending' || t.status === 'approved'
  );

  const puedeEnviar =
    !!user &&
    user.currentRole === 'asistente' &&
    !!isAsistente &&
    !tienePropuestaActiva;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.roles?.includes('asistente')) {
      navigate('/asistente');
      return;
    }
    if (user.currentRole !== 'asistente') {
      navigate('/asistente');
      return;
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (user.currentRole !== 'asistente' || !isAsistente) {
      setError('Debés tener el rol asistente activo para proponer un taller.');
      return;
    }

    if (!puedeEnviar) {
      setError('Ya tenés una propuesta de taller activa (pendiente o aprobada).');
      return;
    }

    const file = formData.file;
    if (!file) {
      setError('Debés adjuntar un archivo PDF.');
      return;
    }

    const extOk = file.name.toLowerCase().endsWith('.pdf');
    const mimeOk = !file.type || file.type === 'application/pdf';
    if (!extOk || !mimeOk) {
      setError('El archivo debe ser formato PDF (.pdf).');
      return;
    }

    const all = JSON.parse(localStorage.getItem(TALLERES_KEY) || '[]');
    const nuevo = {
      id: Date.now().toString(),
      userId: user.id,
      titulo: formData.titulo.trim(),
      descripcion: formData.descripcion.trim(),
      metodologia: formData.metodologia.trim(),
      archivo: file.name,
      status: 'pending',
      fechaEnvio: new Date(),
    };

    localStorage.setItem(TALLERES_KEY, JSON.stringify([...all, nuevo]));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-lg">
          <CheckCircle className="w-16 h-16 text-[#2d5016] mx-auto mb-4" />
          <p className="text-lg text-gray-800 font-medium">
            Tu propuesta fue enviada correctamente y está siendo evaluada
          </p>
          <button
            type="button"
            onClick={() => navigate('/asistente')}
            className="mt-8 w-full sm:w-auto px-8 py-2.5 bg-[#2d5016] text-white rounded-lg hover:opacity-95 transition text-sm font-medium"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl mb-4">Proponer Taller</h1>

          <p className="text-sm text-gray-600 mb-4">
            Propuestas enviadas (tus registros): {talleresMine.length}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
          )}

          {!puedeEnviar ? (
            <div className="text-center text-gray-600 py-6">
              Ya registraste una propuesta de taller pendiente o aprobada. No podés enviar otra hasta
              que la situación cambie.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Título del taller"
                required
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full border p-2 rounded"
              />

              <textarea
                placeholder="Descripción"
                required
                rows={4}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full border p-2 rounded resize-y min-h-[100px]"
              />

              <textarea
                placeholder="Metodología (cómo se desarrollará el taller)"
                required
                rows={4}
                value={formData.metodologia}
                onChange={(e) => setFormData({ ...formData, metodologia: e.target.value })}
                className="w-full border p-2 rounded resize-y min-h-[100px]"
              />

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Adjunto (PDF obligatorio)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,application/pdf"
                  onChange={(e) =>
                    setFormData({ ...formData, file: e.target.files?.[0] || null })
                  }
                  className="w-full text-sm"
                />
              </div>

              <button type="submit" className="w-full bg-[#2d5016] text-white py-2 rounded">
                Enviar propuesta de taller
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
