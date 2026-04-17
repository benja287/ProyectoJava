import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Upload, CheckCircle } from 'lucide-react';

export function InscriptionPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    institution: '',
    province: '',
    category: '',
    receipt: null as File | null,
  });
  const [submitted, setSubmitted] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  
    const roles = user.roles || [];
  
    updateUser({
      institution: formData.institution,
      province: formData.province,
      category: formData.category,
      receipt: formData.receipt?.name,
      inscriptionStatus: 'pending',
      isInscripto: true,
      roles: roles.includes('asistente') 
        ? roles 
        : [...roles, 'asistente'],
    });
  
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-block p-4 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h2 className="text-3xl text-gray-800 mb-4">¡Inscripción Enviada!</h2>
          <p className="text-gray-600 mb-6">
            Tu solicitud de inscripción ha sido enviada correctamente. El equipo organizador 
            revisará tu comprobante de pago y te notificará cuando sea confirmada.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Estado actual: <strong className="text-amber-600">Pendiente de aprobación</strong>
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
    <div className="min-h-[calc(100vh-80px)] py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-green-100 rounded-lg">
              <CreditCard className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl text-gray-800">Inscripción al Congreso</h1>
              <p className="text-gray-600">Completa tus datos y adjunta el comprobante de pago</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institución / Organización
              </label>
              <input
                type="text"
                required
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nombre de tu institución"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provincia
              </label>
              <select
                required
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecciona una provincia</option>
                <option value="Buenos Aires">Buenos Aires</option>
                <option value="CABA">CABA</option>
                <option value="Córdoba">Córdoba</option>
                <option value="Santa Fe">Santa Fe</option>
                <option value="Mendoza">Mendoza</option>
                <option value="Otra">Otra</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría de Inscripción
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecciona una categoría</option>
                <option value="socio_saae">Socio SAAE</option>
                <option value="no_socio">No Socio</option>
                <option value="estudiante">Estudiante</option>
                <option value="productor">Productor de Organización</option>
                <option value="extranjero">Extranjero</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comprobante de Pago
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFormData({ ...formData, receipt: e.target.files?.[0] || null })}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Formatos aceptados: PDF, JPG, PNG
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h3 className="font-semibold text-blue-900 mb-2">Información de Pago</h3>
              <p className="text-sm text-blue-800 mb-2">
                Realiza la transferencia a la siguiente cuenta:
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li><strong>Banco:</strong> Banco Nación</li>
                <li><strong>CBU:</strong> 0110000000000000000000</li>
                <li><strong>Alias:</strong> CONGRESO.AGRO</li>
              </ul>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-lg"
            >
              Enviar Inscripción
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
