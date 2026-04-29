import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { CheckCircle, FileText } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import {
  CIRCULARES_KEY,
  CONGRESS_EVENT_DATES,
  congressDateLabels,
  type StoredCircular,
  type CircularStatus,
} from '../../../constants/congressEvent';
import {
  saveBrowserFile,
  deleteBrowserFile,
  readFileAsBase64,
  MAX_FILE_BASE64_EMBED_BYTES,
} from '../../../lib/browserFiles';

type Mode = 'new' | 'edit';

export function AdminCircularForm() {
  const { user, sendNotificationToAll } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const mode: Mode = useMemo(() => (params?.id ? 'edit' : 'new'), [params]);
  const circularId = params?.id as string | undefined;

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);

  const [pendingPdf, setPendingPdf] = useState<File | null>(null);
  const [form, setForm] = useState<{
    number: string;
    date: string;
    title: string;
    summary: string;
    content: string;
    status: CircularStatus;
    pdfName: string;
    pdfFileId?: string;
    pdfData?: string;
    pdfMimeType?: string;
  }>({
    number: '',
    date: CONGRESS_EVENT_DATES[0],
    title: '',
    summary: '',
    content: '',
    status: 'published',
    pdfName: '',
  });

  const inputCls =
    'w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200';
  const labelCls = 'block text-sm text-gray-600 mb-1';

  useEffect(() => {
    if (!user || user.currentRole !== 'admin') {
      navigate('/');
      return;
    }
    if (mode === 'edit') {
      const all = JSON.parse(localStorage.getItem(CIRCULARES_KEY) || '[]') as StoredCircular[];
      const c = all.find((x) => x.id === circularId);
      if (!c) {
        navigate('/admin', { replace: true, state: { circularesFeedback: 'No se encontró la circular.' } });
        return;
      }
      setForm({
        number: c.number,
        date: c.date,
        title: c.title,
        summary: c.summary,
        content: c.content,
        status: c.status,
        pdfName: c.pdfName || '',
        pdfFileId: c.pdfFileId,
        pdfData: c.pdfData,
        pdfMimeType: c.pdfMimeType,
      });
    }
  }, [user, navigate, mode, circularId]);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setError('');
    if (!f) return;
    const ok = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
    if (!ok) {
      setError('El archivo debe estar en formato PDF.');
      e.target.value = '';
      return;
    }
    setPendingPdf(f);
    setForm((p) => ({
      ...p,
      pdfName: f.name,
      pdfFileId: undefined,
      pdfData: undefined,
      pdfMimeType: undefined,
    }));
  };

  const validate = () => {
    if (!form.number.trim() || !form.title.trim()) {
      setError('Completá al menos el número y el título.');
      return false;
    }
    // HU: archivo en PDF. Para publicar, lo pedimos obligatorio.
    if (form.status === 'published' && !pendingPdf && !form.pdfFileId && !form.pdfData) {
      setError('Para publicar, debés adjuntar un PDF.');
      return false;
    }
    return true;
  };

  const saveNow = async () => {
    if (!validate()) return;
    setUploading(true);
    setError('');

    const all = (JSON.parse(localStorage.getItem(CIRCULARES_KEY) || '[]') as StoredCircular[]) || [];
    const now = new Date().toISOString();

    // Adjuntos
    let pdfFileId = form.pdfFileId;
    let pdfData = form.pdfData;
    let pdfMimeType = form.pdfMimeType;
    let pdfName = form.pdfName || undefined;
    let newlyUploadedFileId: string | undefined;

    if (pendingPdf) {
      try {
        const stored = await saveBrowserFile(pendingPdf);
        newlyUploadedFileId = stored.fileId;
        // Si estamos editando, borramos el viejo de IndexedDB (si existía)
        if (mode === 'edit' && circularId) {
          const old = all.find((x) => x.id === circularId);
          if (old?.pdfFileId && old.pdfFileId !== stored.fileId) void deleteBrowserFile(old.pdfFileId);
        }
        pdfFileId = stored.fileId;
        pdfMimeType = stored.fileType || 'application/pdf';
        pdfName = stored.fileName;
        pdfData =
          pendingPdf.size <= MAX_FILE_BASE64_EMBED_BYTES ? await readFileAsBase64(pendingPdf) : undefined;
      } catch {
        setUploading(false);
        setError('No se pudo guardar el PDF. Intentá de nuevo.');
        return;
      }
    }

    const base = {
      number: form.number.trim(),
      date: form.date,
      title: form.title.trim(),
      summary: form.summary.trim(),
      content: form.content.trim(),
      status: form.status,
      updatedAt: now,
      pdfName,
      pdfFileId,
      pdfData,
      pdfMimeType,
    };

    let next: StoredCircular[];
    let saved: StoredCircular;

    if (mode === 'edit' && circularId) {
      next = all.map((c) => (c.id === circularId ? { ...c, ...base } : c));
      saved = next.find((c) => c.id === circularId)!;
    } else {
      saved = { id: `circ-${Date.now()}`, ...base };
      next = [...all, saved];
    }

    try {
      localStorage.setItem(CIRCULARES_KEY, JSON.stringify(next));
    } catch (err) {
      if (newlyUploadedFileId) void deleteBrowserFile(newlyUploadedFileId);
      setUploading(false);
      setError(
        err instanceof DOMException && err.name === 'QuotaExceededError'
          ? 'Almacenamiento lleno. Probá con un PDF más liviano.'
          : 'No se pudo guardar.'
      );
      return;
    }

    // HU-26: al publicar, notificar en novedades
    if (saved.status === 'published') {
      try {
        sendNotificationToAll(
          'Nueva circular publicada',
          `${saved.number} — ${saved.title}`,
          undefined
        );
      } catch {
        // no bloquea guardado
      }
    }

    setUploading(false);
    setPendingPdf(null);

    if (saved.status === 'published') {
      setSubmitted(true);
      return;
    }

    navigate('/admin', {
      state: {
        circularesFeedback:
          mode === 'edit' ? 'La circular fue actualizada correctamente.' : 'La circular fue guardada en borrador.',
      },
    });
  };

  if (!user || user.currentRole !== 'admin') return null;

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-700 mx-auto mb-4" />
          <h2 className="text-2xl text-gray-900 font-semibold mb-2">La circular fue publicada correctamente</h2>
          <p className="text-gray-600 mb-6">Ya está visible en la sección pública de circulares.</p>
          <button
            type="button"
            onClick={() => navigate('/admin', { state: { circularesFeedback: 'La circular fue publicada correctamente.' } })}
            className="px-6 py-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition"
          >
            Volver al panel de administración
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-emerald-700" />
            <div>
              <h1 className="text-3xl text-gray-900">
                {mode === 'edit' ? 'Editar circular' : 'Nueva circular'}
              </h1>
              <p className="text-sm text-gray-600">
                {mode === 'edit'
                  ? 'Al guardar se reemplaza la versión anterior (no se puede recuperar).'
                  : 'Al publicar quedará visible en la sección pública de circulares.'}
              </p>
            </div>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Número</label>
                <input
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="Circular I / Circular 1"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Fecha</label>
                <select
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={inputCls}
                >
                  {congressDateLabels().map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Título</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Título visible para los usuarios"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Resumen</label>
              <textarea
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                rows={3}
                placeholder="Resumen breve para la lista pública"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Contenido</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={8}
                placeholder="Texto completo de la circular"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Estado</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as CircularStatus })}
                className={inputCls}
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicar</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>PDF (obligatorio al publicar)</label>
              <input type="file" accept=".pdf,application/pdf" onChange={handlePdfChange} className="w-full text-sm" />
              {form.pdfName && (
                <p className="text-xs text-gray-500 mt-2">
                  PDF cargado: <span className="font-medium">{form.pdfName}</span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => {
                  if (!validate()) return;
                  if (mode === 'edit') {
                    setShowConfirmSave(true);
                    return;
                  }
                  void saveNow();
                }}
                className="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800 transition disabled:opacity-60"
              >
                {mode === 'edit' ? 'Guardar cambios' : 'Publicar'}
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => navigate('/admin')}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirmSave && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirmSave(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirmar edición</h2>
            <p className="text-gray-600 mb-5">
              ¿Estás seguro de editar esta circular? La versión anterior no se podrá recuperar.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmSave(false)}
                className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmSave(false);
                  void saveNow();
                }}
                className="px-4 py-2 text-sm bg-emerald-700 text-white rounded hover:bg-emerald-800"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

