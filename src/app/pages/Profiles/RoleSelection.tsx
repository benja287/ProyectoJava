import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Users, FileText, ClipboardCheck, Settings } from 'lucide-react';

export function RoleSelection() {
  const { user, selectRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!user || !user.roles) {
      navigate('/login');
      return;
    }
    
    if (user.roles.length <= 1) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || !user.roles || user.roles.length <= 1) {
    return null;
  }

  const handleRoleSelect = (role: string) => {
    selectRole(role as any);
    navigate('/');
  };

  const roleInfo = {
    asistente: {
      icon: Users,
      title: 'Asistente',
      description: 'Accede al programa, arma tu agenda y participa de todas las actividades',
      color: 'from-blue-500 to-blue-600',
    },
    autor: {
      icon: FileText,
      title: 'Autor',
      description: 'Gestiona tus trabajos presentados y ve el cronograma de tus presentaciones',
      color: 'from-green-500 to-green-600',
    },
    evaluador: {
      icon: ClipboardCheck,
      title: 'Evaluador',
      description: 'Accede a los trabajos asignados y realiza las evaluaciones correspondientes',
      color: 'from-purple-500 to-purple-600',
    },
    admin: {
      icon: Settings,
      title: 'Administrador',
      description: 'Gestiona todo el sistema del congreso: usuarios, programa, inscripciones y más',
      color: 'from-red-500 to-red-600',
    },
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl text-gray-800 mb-4">Selecciona tu rol</h1>
          <p className="text-gray-600 text-lg">
            Tienes múltiples roles asignados. Elige con cuál deseas ingresar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {user.roles.map((role) => {
            const info = roleInfo[role];
            if (!info) return null;

            const Icon = info.icon;

            return (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:-translate-y-1 text-left"
              >
                <div className={`inline-block p-4 rounded-lg bg-gradient-to-r ${info.color} mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl mb-3 text-gray-800">{info.title}</h3>
                <p className="text-gray-600 mb-4">{info.description}</p>
                <div className="mt-6 text-[#2d5016] font-medium flex items-center gap-2">
                  Ingresar como {info.title}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Puedes cambiar de rol en cualquier momento desde el menú de tu perfil
          </p>
        </div>
      </div>
    </div>
  );
}
