import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Award, Calendar, Clock, MapPin } from 'lucide-react';

export function PanelAutor() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [presentations, setPresentations] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.currentRole !== 'autor') {
      navigate('/');
      return;
    }

    const works = JSON.parse(localStorage.getItem('congress_works') || '[]');

    const myPresentations = works.filter(
      (w: any) =>
        w.userId === user.id &&
        w.status === 'scheduled'
    );

    setPresentations(myPresentations);

  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-5xl">

        <div className="bg-gradient-to-r from-[#2d5016] to-[#3d6b23] text-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl">Mis Presentaciones</h1>
        </div>
        <button
  onClick={() => navigate('/envio-trabajos')}
  className="mb-6 bg-[#2d5016] text-white px-4 py-2 rounded"
>
  Enviar nuevo trabajo
</button>

        {presentations.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-xl shadow">
            <p className="text-gray-500">
              Aún no tenés presentaciones programadas
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {presentations.map((p) => (
              <div key={p.id} className="bg-white p-6 rounded-xl shadow">

                <h3 className="text-xl mb-4">{p.title}</h3>

                <div className="flex gap-6 text-sm text-gray-600">

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(p.fecha).toLocaleDateString('es-AR')}
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {p.hora}
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {p.sala}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}