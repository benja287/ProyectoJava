import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, MapPin } from 'lucide-react';

export function ProgramaDetalladoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.currentRole !== 'asistente' && user.currentRole !== 'autor')) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || (user.currentRole !== 'asistente' && user.currentRole !== 'autor')) {
    return null;
  }

  const activities = [
    {
      id: 1,
      title: 'Conferencia: Soberanía Alimentaria',
      time: '09:00 - 11:00',
      room: 'Aula Magna',
      date: '2027-05-10',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-5xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-4xl text-gray-800 mb-2">Programa Detallado</h1>
          <p className="text-gray-600 mb-8">Cronograma completo con todas las actividades</p>

          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                <h3 className="text-xl mb-4 text-gray-800">{activity.title}</h3>
                <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#2d5016]" />
                    {new Date(activity.date).toLocaleDateString('es-AR')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#2d5016]" />
                    {activity.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#2d5016]" />
                    {activity.room}
                  </div>
                </div>
                <button className="px-4 py-2 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition text-sm">
                  Agregar a mi agenda
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
