import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Calendar, FileText } from 'lucide-react';

export function PanelAsistente() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const programPublished = false;

  useEffect(() => {
    // 🔒 No logueado → login
    if (!user) {
      navigate('/login');
      return;
    }

    // 🔒 Solo asistentes o autores
    if (!user.roles?.includes('asistente') && !user.roles?.includes('autor')) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  if (!user) return null;

  const isAsistente = user.roles?.includes('asistente');
  const isAutor = user.roles?.includes('autor');

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-4xl">

        

        

        {/* ACCIONES */}
        <div className="mt-8">

          <h2 className="text-2xl text-gray-800 mb-4">
            Acciones disponibles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 🟡 Enviar trabajo (solo asistente) */}
            {isAsistente  && (
              <Link
                to="/envio-trabajos"
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <FileText className="w-8 h-8 text-amber-600" />
                  </div>

                  <div>
                    <h3 className="text-xl text-gray-800">
                      Enviar Trabajo
                    </h3>
                    <p className="text-gray-600">
                      Presenta tu trabajo científico o relato de experiencia
                    </p>
                  </div>
                </div>
              </Link>
            )}

            
          </div>
        </div>

      </div>
    </div>
  );
}