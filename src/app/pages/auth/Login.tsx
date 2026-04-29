import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    const result = await login(email, password);
  
    if (!result.success) {
      const users = JSON.parse(localStorage.getItem('congress_users') || '[]');
      const userExists = users.some((u: any) => u.email === email);
  
      if (!userExists) {
        setError('El email ingresado no se encuentra registrado');
      } else {
        setError('La contraseña no es válida. Intente nuevamente');
      }
      return;
    }
  
    const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');

    if (currentUser.roles && currentUser.roles.length > 1) {
      // 🔥 BORRAR EL ROL ACTUAL SI EXISTE
      delete currentUser.currentRole;
    
      localStorage.setItem('current_user', JSON.stringify(currentUser));
    
      navigate('/select-role');
      return;
    }

// 🔥 SI TIENE SOLO UN ROL → ASIGNAR AUTOMÁTICAMENTE
if (currentUser.roles?.length === 1) {
  currentUser.currentRole = currentUser.roles[0];
  localStorage.setItem('current_user', JSON.stringify(currentUser));
}

// 🔥 REDIRECCIÓN FINAL SEGÚN ROL ACTIVO
if (currentUser.currentRole === 'admin') {
  navigate('/admin');
} else if (!currentUser.roles || currentUser.roles.length === 0) {
  navigate('/inscripcion');
} else if (currentUser.currentRole === 'asistente') {
  navigate('/asistente');
} else if (currentUser.currentRole === 'autor') {
  navigate('/');
} else if (currentUser.currentRole === 'evaluador') {
  navigate('/evaluador');
} else {
  navigate('/');
}
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-green-50 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-[#2d5016]" />
            </div>
            <h2 className="text-3xl text-gray-800">Iniciar sesión</h2>
            <p className="text-gray-600 mt-2">Accede a tu cuenta del congreso</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c3a] focus:border-transparent bg-white"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c3a] focus:border-transparent bg-white"
                placeholder="Tu contraseña"
              />
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-[#2d5016] hover:text-[#3d6b23]"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition font-medium"
            >
              Iniciar sesión
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-[#2d5016] hover:text-[#3d6b23] font-medium">
                Registrarse
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
