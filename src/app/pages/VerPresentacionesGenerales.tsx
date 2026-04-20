import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

export function VerPresentacionesGenerales() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [mesasTematicas, setMesasTematicas] = useState<any[]>([]);
  const [mesasRedondas, setMesasRedondas] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [posterSessions, setPosterSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const sesiones = JSON.parse(localStorage.getItem('congress_sessions') || '[]');
    const redondas = JSON.parse(localStorage.getItem('congress_roundtables') || '[]');
    const allWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    const allUsers = JSON.parse(localStorage.getItem('congress_users') || '[]');
    const posters = JSON.parse(localStorage.getItem('congress_posters') || '[]');
    setMesasTematicas(sesiones);
    setMesasRedondas(redondas);
    setWorks(allWorks);
    setUsers(allUsers);
    setPosterSessions(posters);

  }, [user, navigate]);

  if (!user) return null;

  // 🔥 función helper para obtener autor
  const getAuthor = (userId: string) => {
    const u = users.find(u => u.id === userId);
    return u ? `${u.name} ${u.lastName}` : 'Autor desconocido';
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-5xl">

        <div className="bg-white rounded-xl shadow-lg p-8">

          <h1 className="text-4xl mb-2">Programa del Congreso</h1>
          <p className="text-gray-600 mb-8">
            Mesas temáticas y mesas redondas
          </p>

          {/* 🟢 MESAS TEMÁTICAS */}
          <h2 className="text-2xl mb-4">Mesas Temáticas</h2>

          {mesasTematicas.length === 0 ? (
            <p className="text-gray-500 mb-6">No hay mesas temáticas</p>
          ) : (
            <div className="space-y-6 mb-10">
              {mesasTematicas.map((mesa) => {

                // 🔥 traer trabajos reales de esa mesa
                const trabajosMesa = works.filter(w => mesa.works.includes(w.id));

                return (
                  <div key={mesa.id} className="border p-6 rounded-lg bg-green-50">

                    <h3 className="text-xl font-semibold mb-2">
                      {mesa.code} - {mesa.name}
                    </h3>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {mesa.date || 'Sin fecha'}
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {mesa.startTime} - {mesa.endTime}
                      </span>

                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {mesa.room}
                      </span>
                    </div>

                    {/* 🔥 LISTA DE EXPOSICIONES */}
                    <div>
                      <p className="font-medium mb-2">Exposiciones:</p>

                      {trabajosMesa.length === 0 ? (
                        <p className="text-sm text-gray-500">Sin trabajos asignados</p>
                      ) : (
                        <ol className="space-y-2">
                          {trabajosMesa.map((trabajo, index) => (
                            <li key={trabajo.id} className="text-sm">
                              <p className="font-medium">
                                {index + 1}. {trabajo.title}
                              </p>
                              
                              <p className="text-gray-600">
                                Autor: {getAuthor(trabajo.userId)}
                              </p>

                              <p className="text-gray-600">
                                Tipo: {trabajo.axis}
                              </p>
                              
                              
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* 🔵 MESAS REDONDAS */}
          <h2 className="text-2xl mb-4">Mesas Redondas</h2>

          {mesasRedondas.length === 0 ? (
            <p className="text-gray-500">No hay mesas redondas</p>
          ) : (
            <div className="space-y-4">
              {mesasRedondas.map((mesa) => (
                <div key={mesa.id} className="border p-6 rounded-lg bg-blue-50">

                  <h3 className="text-xl font-semibold mb-2">
                    {mesa.title}
                  </h3>

                  <p className="text-sm text-gray-700 mb-2">
                    {mesa.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {mesa.date}
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {mesa.startTime} - {mesa.endTime}
                    </span>

                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {mesa.room}
                    </span>
                  </div>

                  <p className="text-sm">
                    <strong>Modera:</strong> {mesa.moderator}
                  </p>

                  <p className="text-sm">
                    <strong>Panelistas:</strong> {mesa.panelists}
                  </p>

                </div>
              ))}

<h3 className="text-xl mt-8 mb-4 text-yellow-700">Sesiones de Pósters</h3>

{posterSessions.length === 0 ? (
  <p>No hay sesiones de pósters</p>
) : (
  posterSessions.map((p) => (
    <div key={p.id} className="border p-4 mb-4 rounded bg-yellow-50">
      
      <h3>{p.name}</h3>

      <p>
        📅 {p.date} | 🕒 {p.startTime} - {p.endTime} | 📍 {p.location}
      </p>

      <ul className="ml-4 list-disc">
        {p.works.map((w: any) => {
          const work = works.find((wk: any) => wk.id === w.workId);

          return (
            <li key={w.workId}>
              <span className="font-medium">
                {work?.title}
              </span>
              <div className="text-sm text-gray-600">
                Autor: {getAuthor(work?.userId)} | Panel: {w.stand}
              </div>
              <div className="text-sm text-gray-600">
             Tipo: {(work?.axis)}
            </div>
            </li>
          );
        })}
      </ul>

    </div>
  ))
)}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}