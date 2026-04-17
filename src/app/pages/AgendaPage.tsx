import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Calendar, Trash2 } from 'lucide-react';

export function AgendaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== 'asistente' && user.role !== 'autor')) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gray-50">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-4 mb-8">
            <Calendar className="w-10 h-10 text-green-600" />
            <div>
              <h1 className="text-3xl text-gray-800">Mi Agenda Personal</h1>
              <p className="text-gray-600">Actividades seleccionadas con validación de horarios</p>
            </div>
          </div>

          <div className="text-center py-12">
            <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aún no has agregado actividades a tu agenda</p>
            <button
              onClick={() => navigate('/program')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Explorar Programa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
