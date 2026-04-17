import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

const mockProgram = [
  {
    id: 1,
    type: 'Conferencia',
    title: 'Agroecología y Soberanía Alimentaria',
    speaker: 'Dr. Juan Pérez',
    date: '2027-05-10',
    time: '09:00 - 11:00',
    room: 'Aula Magna',
    building: 'Facultad de Ciencias Agrarias',
  },
  {
    id: 2,
    type: 'Mesa Temática',
    title: 'Agricultura Urbana y Periurbana',
    participants: 'Varios expositores',
    date: '2027-05-10',
    time: '14:00 - 16:00',
    room: 'Aula 3',
    building: 'Facultad de Ciencias Agrarias',
  },
  {
    id: 3,
    type: 'Taller',
    title: 'Compostaje y Manejo de Residuos Orgánicos',
    coordinator: 'Lic. María González',
    date: '2027-05-11',
    time: '10:00 - 12:00',
    room: 'Aula 5',
    building: 'Facultad de Ciencias Agrarias',
  },
  {
    id: 4,
    type: 'Feria',
    title: 'Feria Agroecológica',
    description: 'Productos de todo el país',
    date: '2027-05-10',
    time: '08:00 - 18:00',
    location: 'Plaza Central',
    building: 'Campus Universitario',
  },
];

export function ProgramPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Solo asistentes y autores pueden ver el programa completo
    if (!user || (user.role !== 'asistente' && user.role !== 'autor')) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (!user || (user.role !== 'asistente' && user.role !== 'autor')) {
    return null;
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Conferencia': return 'bg-blue-100 text-blue-800';
      case 'Mesa Temática': return 'bg-purple-100 text-purple-800';
      case 'Taller': return 'bg-green-100 text-green-800';
      case 'Feria': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gray-50">
      <div className="container mx-auto max-w-5xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl text-gray-800 mb-4">Programa del Congreso</h1>
          <p className="text-gray-600">
            Explora las conferencias, mesas temáticas, talleres y actividades del 
            V Congreso Argentino de Agroecología 2027
          </p>
        </div>

        <div className="space-y-6">
          {mockProgram.map((activity) => (
            <div key={activity.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(activity.type)}`}>
                        {activity.type}
                      </span>
                    </div>
                    <h3 className="text-2xl text-gray-800 mb-2">{activity.title}</h3>
                    {activity.speaker && (
                      <p className="text-gray-600">
                        <strong>Expositor:</strong> {activity.speaker}
                      </p>
                    )}
                    {activity.participants && (
                      <p className="text-gray-600">
                        <strong>Participantes:</strong> {activity.participants}
                      </p>
                    )}
                    {activity.coordinator && (
                      <p className="text-gray-600">
                        <strong>Coordina:</strong> {activity.coordinator}
                      </p>
                    )}
                    {activity.description && (
                      <p className="text-gray-600">{activity.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="text-sm">{new Date(activity.date).toLocaleDateString('es-AR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span className="text-sm">{activity.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <span className="text-sm">
                      {activity.room || activity.location}, {activity.building}
                    </span>
                  </div>
                </div>

                <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                  Agregar a mi Agenda
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Nota Importante</h3>
          <p className="text-blue-800 text-sm">
            El programa completo solo es visible para asistentes con inscripción confirmada. 
            Puedes agregar actividades a tu agenda personal y el sistema validará automáticamente 
            que no haya superposición de horarios.
          </p>
        </div>
      </div>
    </div>
  );
}
