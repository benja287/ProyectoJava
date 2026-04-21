import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { CheckCircle } from 'lucide-react';
import { saveBrowserFile, deleteBrowserFile } from '../lib/browserFiles';

export function EnvioTrabajosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState('');
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    axis:  '',
    type:  '',
    file:  null as File | null,
  });

  const [myWorks, setMyWorks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    setMyWorks(allWorks.filter((w: any) => w.userId === user.id));
  }, [user, navigate]);

  if (!user) return null;

  // ── Validaciones de rol ────────────────────────────────────────────────────
  const isAutor = user.currentRole === 'autor';
  const isAsistente = user.currentRole === 'asistente';
  /** Si la cuenta tiene ambos roles, los trabajos solo se envían con rol autor activo (no desde el flujo “asistente”). */
  const cuentaTieneAutor = user.roles?.includes('autor');
  const cuentaTieneAsistente = user.roles?.includes('asistente');
  const bloqueadoPorDobleRol =
    isAsistente && cuentaTieneAutor && cuentaTieneAsistente;

  const activeWorks          = myWorks.filter((w) => w.status !== 'rejected');
  const rejectedWithAttempts = myWorks.filter(
    (w) => w.status === 'rejected' && (w.attempts || 1) < 3
  );

  const canSubmit = () => {
    if (!isAutor && !isAsistente) return false;
    if (bloqueadoPorDobleRol) return false;
    if (rejectedWithAttempts.length > 0) return true;
    if (isAutor) return activeWorks.length < 2;
    // Solo asistente (sin rol autor en la cuenta): 1 trabajo
    if (isAsistente && !cuentaTieneAutor) return activeWorks.length < 1;
    return false;
  };

  const submissionBlockedReason = (() => {
    if (!isAutor && !isAsistente)
      return 'Necesitás ingresar con rol asistente o autor para enviar trabajos.';
    if (bloqueadoPorDobleRol) {
      return 'Tu cuenta tiene rol autor y asistente. Cambiá a rol autor desde el menú de usuario y enviá tus trabajos desde el panel Autor (hasta 2 trabajos activos).';
    }
    if (rejectedWithAttempts.length > 0) return '';
    if (isAutor && activeWorks.length >= 2)
      return 'Como autor ya alcanzaste el máximo de 2 trabajos activos.';
    if (isAsistente && !cuentaTieneAutor && activeWorks.length >= 1)
      return 'Como asistente ya alcanzaste el máximo de 1 trabajo activo.';
    return '';
  })();

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (bloqueadoPorDobleRol) {
      setError(
        'Con rol asistente activo no podés enviar trabajos porque tu cuenta también es autora. Cambiá a rol autor y volvé a intentar.'
      );
      return;
    }
    if (!canSubmit()) { setError('No podés enviar más trabajos según tu rol.'); return; }
    if (!formData.file) { setError('Debés adjuntar un archivo PDF.'); return; }
    if (!formData.type) { setError('Debés seleccionar el tipo: Oral o Poster.'); return; }

    setUploading(true);

    // ── Guardar archivo en IndexedDB (NO en localStorage) ──────────────────
    // Si IndexedDB falla, el trabajo igual se guarda sin archivo — no bloqueamos el envío
    let storedFile = null;
    try {
      storedFile = await saveBrowserFile(formData.file);
    } catch {
      console.warn('No se pudo guardar el archivo en IndexedDB');
    }

    const allWorks     = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const rejectedWork = myWorks.find(
      (w) => w.status === 'rejected' && (w.attempts || 1) < 3
    );

    let updatedWorks;

    if (rejectedWork) {
      // Reenvío — eliminar archivo viejo de IndexedDB si existía
      if (rejectedWork.fileId) void deleteBrowserFile(rejectedWork.fileId);

      updatedWorks = allWorks.map((w: any) =>
        w.id === rejectedWork.id
          ? {
              ...w,
              title:    formData.title,
              axis:     formData.axis,
              type:     formData.type,
              status:   'pending',
              attempts: (w.attempts || 1) + 1,
              ...(storedFile ? {
                fileName: storedFile.fileName,
                fileId:   storedFile.fileId,
                fileType: storedFile.fileType,
                fileSize: storedFile.fileSize,
              } : {}),
            }
          : w
      );
    } else {
      // Trabajo nuevo
      const newWork: any = {
        id:       Date.now().toString(),
        userId:   user.id,
        userName: `${user.name} ${user.lastName}`,
        title:    formData.title,
        axis:     formData.axis,
        type:     formData.type,
        status:   'pending',
        attempts: 1,
        fecha:    null,
        hora:     null,
        sala:     null,
      };
      if (storedFile) {
        newWork.fileName = storedFile.fileName;
        newWork.fileId   = storedFile.fileId;
        newWork.fileType = storedFile.fileType;
        newWork.fileSize = storedFile.fileSize;
      }
      updatedWorks = [...allWorks, newWork];
    }

    // Guardar en localStorage solo metadatos — el archivo ya está en IndexedDB
    try {
      localStorage.setItem('congress_works', JSON.stringify(updatedWorks));
    } catch (err) {
      if (storedFile) void deleteBrowserFile(storedFile.fileId);
      setError(
        err instanceof DOMException && err.name === 'QuotaExceededError'
          ? 'El almacenamiento está lleno. Liberá espacio del navegador e intentá de nuevo.'
          : 'No se pudo guardar el trabajo. Intentá de nuevo.'
      );
      setUploading(false);
      return;
    }

    setUploading(false);
    setSubmitted(true);
  };

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
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
          )}

          {!canSubmit() ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-center">
              <p className="text-amber-900 font-medium">
                No podés enviar un nuevo trabajo en este momento.
              </p>
              {submissionBlockedReason && (
                <p className="text-sm text-amber-800 mt-2">{submissionBlockedReason}</p>
              )}
              <p className="text-xs text-amber-700 mt-3">
                Trabajos activos: {activeWorks.length} | Reenvíos disponibles: {rejectedWithAttempts.length}
              </p>
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

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="oral"
                    checked={formData.type === 'oral'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                  Oral
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="poster"
                    checked={formData.type === 'poster'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                  Poster
                </label>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Adjunto (PDF obligatorio)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setError('');
                    setFormData({ ...formData, file });
                  }}
                  className="w-full text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  El archivo se guarda localmente en este navegador para su revisión.
                </p>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-[#2d5016] text-white py-2 rounded hover:bg-[#3d6b23] transition disabled:opacity-60"
              >
                {uploading ? 'Enviando...' : 'Enviar trabajo'}
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}