import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { FileText, Upload, CheckCircle } from 'lucide-react';

export function SubmitWork() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    modality: '',
    axis: '',
    file: null as File | null,
  });

  useEffect(() => {
    if (!user || (user.role !== 'asistente' && user.role !== 'autor')) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl text-gray-800 mb-4">¡Trabajo Enviado!</h2>
          <p className="text-gray-600 mb-6">
            Tu trabajo ha sido enviado correctamente y será evaluado por el Comité.
            Recibirás feedback en tu apartado de mensajes.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gray-50">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-4 mb-8">
            <FileText className="w-10 h-10 text-green-600" />
            <div>
              <h1 className="text-3xl text-gray-800">Enviar Trabajo</h1>
              <p className="text-gray-600">Presenta tu trabajo científico o relato de experiencia</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título del Trabajo</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Título completo de tu trabajo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Trabajo</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecciona un tipo</option>
                <option value="cientifico">Artículo Científico</option>
                <option value="experiencia">Relato de Experiencia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Modalidad</label>
              <select
                required
                value={formData.modality}
                onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecciona una modalidad</option>
                <option value="oral">Presentación Oral</option>
                <option value="poster">Póster</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Eje Temático</label>
              <select
                required
                value={formData.axis}
                onChange={(e) => setFormData({ ...formData, axis: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecciona un eje</option>
                <option value="produccion">Sistemas de Producción</option>
                <option value="comercializacion">Comercialización</option>
                <option value="soberania">Soberanía Alimentaria</option>
                <option value="educacion">Educación y Formación</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Archivo del Trabajo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-2">PDF, DOC o DOCX</p>
              </div>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
              <p className="text-sm text-amber-800">
                <strong>Nota:</strong> Puedes enviar hasta 2 trabajos por inscripción. 
                Tu trabajo será evaluado por el Comité y recibirás feedback en tu apartado de mensajes.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Enviar Trabajo
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
