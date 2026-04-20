import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Upload, CheckCircle } from 'lucide-react';

export function InscripcionPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    institution: user?.institution || '',
    province: user?.province || '',
    category: '',
    receipt: null as File | null,
  });

  const [submitted, setSubmitted] = useState(false);
  const [fileError, setFileError] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }

  // ✅ Tipos permitidos reales
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];

  // ✅ Validación del archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      setFileError('Formato inválido. Solo PDF, JPG o PNG.');
      setFormData({ ...formData, receipt: null });

      // limpia el input visualmente
      e.target.value = '';
      return;
    }

    setFileError('');
    setFormData({ ...formData, receipt: file });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validación extra antes de enviar
    if (!formData.receipt) {
      setFileError('Debes subir un comprobante válido.');
      return;
    }

    updateUser({
      institution: formData.institution,
      province: formData.province,
      inscriptionStatus: 'pending',
      category: formData.category,
      receipt: formData.receipt.name,
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-[#2d5016] mx-auto mb-4" />
          <h2 className="text-3xl text-gray-800 mb-4">Tu inscripción fue enviada</h2>
          <p className="text-gray-600 mb-6">Será validada por el equipo organizador</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg p-8">

          <div className="flex items-center gap-4 mb-8">
            <CreditCard className="w-10 h-10 text-[#2d5016]" />
            <div>
              <h1 className="text-3xl text-gray-800">Inscripción al Congreso</h1>
              <p className="text-gray-600">
                Completa tus datos y adjunta el comprobante de pago
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Institución */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institución
              </label>
              <input
                type="text"
                required
                value={formData.institution}
                onChange={(e) =>
                  setFormData({ ...formData, institution: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c3a]"
              />
            </div>

            {/* Provincia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provincia
              </label>
              <select
                required
                value={formData.province}
                onChange={(e) =>
                  setFormData({ ...formData, province: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Selecciona</option>
                <option value="Buenos Aires">Buenos Aires</option>
                <option value="CABA">CABA</option>
                <option value="Córdoba">Córdoba</option>
                <option value="Misiones">Misiones</option>
              </select>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría de Inscripción
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Selecciona una categoría</option>
                <option value="socio_saae">Socio SAAE</option>
                <option value="no_socio">No Socio</option>
                <option value="estudiante">Estudiante</option>
                <option value="productor">Productor de Organización</option>
                <option value="extranjero">Extranjero</option>
              </select>
            </div>

            {/* Archivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comprobante de Pago
              </label>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />

                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="w-full"
                />

                {fileError && (
                  <p className="text-red-600 text-sm mt-2">{fileError}</p>
                )}

                {formData.receipt && (
                  <p className="text-green-600 text-sm mt-2">
                    Archivo cargado: {formData.receipt.name}
                  </p>
                )}
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              className="w-full py-3 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition font-medium"
            >
              Enviar inscripción
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}