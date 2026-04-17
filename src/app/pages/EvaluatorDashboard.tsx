import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ClipboardCheck, FileText } from 'lucide-react';

export function EvaluatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [works, setWorks] = useState<any[]>([]);

  useEffect(() => {
    console.log('user en useEffect:', user);
    if (!user) return; // espera a que user cargue, no redirige
  
    if (user.currentRole !== 'evaluador') {
      navigate('/');
      return;
    }
  
    const storedWorks = JSON.parse(localStorage.getItem('congress_works') || '[]');
    console.log('storedWorks:', storedWorks);
  
    const pendingWorks = storedWorks.filter((w: any) => w.status === 'pending');
    console.log('pendingWorks:', pendingWorks);
  
    setWorks(pendingWorks);
  }, [user, navigate]);

  if (!user) return null;

  // ✅ APROBAR TRABAJO
  const handleApprove = (workId: string) => {
    const works = JSON.parse(localStorage.getItem('congress_works') || '[]');

    const work = works.find((w: any) => w.id === workId);

    const updatedWorks = works.map((w: any) => {
      if (w.id === workId) {
        return { ...w, status: 'approved' };
      }
      return w;
    });

    localStorage.setItem('congress_works', JSON.stringify(updatedWorks));

    // 🔥 CONVERTIR USUARIO EN AUTOR
    const users = JSON.parse(localStorage.getItem('congress_users') || '[]');

    const updatedUsers = users.map((u: any) => {
      if (u.id === work.userId) {
        return {
          ...u,
          roles: [...new Set([...(u.roles || []), 'autor'])],
        };
      }
      return u;
    });

    localStorage.setItem('congress_users', JSON.stringify(updatedUsers));

    // refrescar lista
    setWorks(updatedWorks.filter((w: any) => w.status === 'pending'));
  };

  // ❌ RECHAZAR TRABAJO
  const handleReject = (workId: string) => {
    const works = JSON.parse(localStorage.getItem('congress_works') || '[]');

    const updatedWorks = works.map((w: any) => {
      if (w.id === workId) {
        return {
          ...w,
          status: 'rejected',
          attempts: (w.attempts || 1) + 1,
        };
      }
      return w;
    });

    localStorage.setItem('congress_works', JSON.stringify(updatedWorks));

    setWorks(updatedWorks.filter((w: any) => w.status === 'pending'));
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gray-50">
      <div className="container mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4">
            <ClipboardCheck className="w-12 h-12 text-purple-600" />
            <div>
              <h1 className="text-3xl text-gray-800">Panel de Evaluador</h1>
              <p className="text-gray-600">Trabajos pendientes de evaluación</p>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-sm text-gray-600 mb-1">Trabajos Pendientes</p>
            <p className="text-3xl text-amber-600">{works.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-sm text-gray-600 mb-1">Evaluados</p>
            <p className="text-3xl text-green-600">-</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-sm text-gray-600 mb-1">Aprobados</p>
            <p className="text-3xl text-blue-600">-</p>
          </div>
        </div>

        {/* LISTA DE TRABAJOS */}
        <div className="space-y-4">
          {works.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No hay trabajos pendientes
            </div>
          ) : (
            works.map((work) => (
              <div key={work.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl text-gray-800 mb-2">{work.title}</h3>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {work.type}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {work.axis}
                      </span>
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                        Pendiente
                      </span>
                    </div>
                  </div>

                  <FileText className="w-8 h-8 text-gray-400" />
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleApprove(work.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                  >
                    Aprobar
                  </button>

                  <button
                    onClick={() => handleReject(work.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                  >
                    Rechazar
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}