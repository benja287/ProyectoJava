import { useState } from 'react';
import { Link } from 'react-router';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';

export function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const users = JSON.parse(localStorage.getItem('congress_users') || '[]');
    const userExists = users.some((u: any) => u.email === email);

    if (!userExists) {
      setError('El correo ingresado no se encuentra registrado');
      return;
    }

    setStep('reset');
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleConfirmReset = () => {
    setError('');

    if (newPassword.length < 8) {
      setError('La clave debe poseer al menos 8 dígitos');
      setShowModal(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('La clave no coincide');
      setShowModal(false);
      return;
    }

    const users = JSON.parse(localStorage.getItem('congress_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.email === email);
    
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      localStorage.setItem('congress_users', JSON.stringify(users));
    }

    setShowModal(false);
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-[#2d5016] mx-auto mb-4" />
          <h2 className="text-3xl text-gray-800 mb-4">¡Contraseña actualizada!</h2>
          <p className="text-gray-600 mb-6">
            Tu contraseña ha sido cambiada exitosamente.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'reset') {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-block p-3 bg-green-50 rounded-full mb-4">
                <Mail className="w-8 h-8 text-[#2d5016]" />
              </div>
              <h2 className="text-3xl text-gray-800">Restablecer contraseña</h2>
              <p className="text-gray-600 mt-2">Ingresa tu nueva contraseña</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c3a] bg-white"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c3a] bg-white"
                  placeholder="Repite tu nueva contraseña"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition font-medium"
              >
                Restablecer
              </button>
            </form>
          </div>
        </div>

        {/* Modal de confirmación */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
              <h3 className="text-xl mb-4 text-gray-800">¿Estás seguro de cambiar la contraseña?</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="flex-1 px-4 py-2 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-green-50 rounded-full mb-4">
              <Mail className="w-8 h-8 text-[#2d5016]" />
            </div>
            <h2 className="text-3xl text-gray-800">¿Olvidaste tu contraseña?</h2>
            <p className="text-gray-600 mt-2">Ingresa tu email para recibir instrucciones</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c3a] bg-white"
                placeholder="tu@email.com"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition font-medium"
            >
              Enviar instrucciones
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link to="/login" className="block text-[#2d5016] hover:text-[#3d6b23]">
              Inicio de sesión
            </Link>
            <Link to="/register" className="block text-[#2d5016] hover:text-[#3d6b23]">
              Registrarse
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
