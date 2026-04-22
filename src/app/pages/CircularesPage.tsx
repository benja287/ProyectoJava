import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, FileDown, X } from 'lucide-react';
import { CIRCULARES_KEY, congressDateLabels, type StoredCircular } from '../constants/congressEvent';
import { openOrDownloadFile } from '../lib/browserFiles';

function dateLabel(iso: string): string {
  const opt = congressDateLabels().find((o) => o.value === iso);
  if (opt) return opt.label;
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function CircularesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [circulares, setCirculares] = useState<StoredCircular[]>([]);
  const [detail, setDetail] = useState<StoredCircular | null>(null);

  const isAdmin = user?.currentRole === 'admin';

  const load = useCallback(() => {
    const raw = JSON.parse(localStorage.getItem(CIRCULARES_KEY) || '[]') as StoredCircular[];
    setCirculares(Array.isArray(raw) ? raw : []);
  }, []);

  useEffect(() => {
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === CIRCULARES_KEY || e.key === null) load();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', load);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', load);
    };
  }, [load]);

  const visible = circulares.filter((c) => (isAdmin ? true : c.status === 'published'));
  const sorted = [...visible].sort(
    (a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt)
  );

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl text-gray-800 mb-2">Circulares</h1>
              <p className="text-gray-600">Novedades del proceso organizativo</p>
              {isAdmin && (
                <p className="text-xs text-amber-700 mt-2">
                  Como administrador ves también los borradores. El público solo ve las publicadas.
                </p>
              )}
            </div>
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition shrink-0"
              >
                <Plus className="w-5 h-5" />
                Gestionar circulares
              </Link>
            )}
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {isAdmin ? 'No hay circulares cargadas todavía.' : 'Todavía no hay circulares publicadas.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sorted.map((circular) => (
                <div
                  key={circular.id}
                  className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50/80 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {circular.number} — {circular.title}
                        </h3>
                        {isAdmin && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              circular.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {circular.status === 'published' ? 'Publicada' : 'Borrador'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{dateLabel(circular.date)}</p>
                      {circular.summary && (
                        <p className="text-sm text-gray-600 mb-3">{circular.summary}</p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setDetail(circular)}
                          className="text-[#2d5016] hover:text-[#3d6b23] font-medium text-sm"
                        >
                          Ver circular →
                        </button>
                        {(circular.pdfFileId || circular.pdfData) && (
                          <button
                            type="button"
                            onClick={() =>
                              void openOrDownloadFile({
                                fileId: circular.pdfFileId,
                                fileName: circular.pdfName,
                                filePdfBase64: circular.pdfData,
                                fallbackMimeType: circular.pdfMimeType || 'application/pdf',
                              })
                            }
                            className="inline-flex items-center gap-1 text-sm text-teal-700 border border-teal-300 bg-teal-50 hover:bg-teal-100 px-3 py-1 rounded-lg transition"
                          >
                            <FileDown className="w-4 h-4" />
                            Descargar PDF
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetail(null);
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>
            <p className="text-xs text-gray-500 mb-1">{dateLabel(detail.date)}</p>
            <h2 className="text-2xl font-semibold text-gray-900 pr-10 mb-2">
              {detail.number} — {detail.title}
            </h2>
            {isAdmin && (
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded-full mb-4 ${
                  detail.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {detail.status === 'published' ? 'Publicada' : 'Borrador'}
              </span>
            )}
            {detail.summary && (
              <p className="text-gray-700 border-l-4 border-[#2d5016] pl-3 mb-4">{detail.summary}</p>
            )}
            <div className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed mb-6">
              {detail.content || 'Sin contenido de texto.'}
            </div>
            {(detail.pdfFileId || detail.pdfData) && (
              <button
                type="button"
                onClick={() =>
                  void openOrDownloadFile({
                    fileId: detail.pdfFileId,
                    fileName: detail.pdfName,
                    filePdfBase64: detail.pdfData,
                    fallbackMimeType: detail.pdfMimeType || 'application/pdf',
                  })
                }
                className="inline-flex items-center gap-2 text-sm text-teal-700 border border-teal-300 bg-teal-50 hover:bg-teal-100 px-4 py-2 rounded-lg transition"
              >
                <FileDown className="w-4 h-4" />
                Ver / descargar PDF
              </button>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cerrar
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setDetail(null);
                    navigate('/admin');
                  }}
                  className="px-4 py-2 text-sm bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23]"
                >
                  Ir al panel admin
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
