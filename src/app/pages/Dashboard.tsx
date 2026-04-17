import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard,
  Calendar,
  FileText,
  Award,
  User,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Redirección por rol activo
    if (user.currentRole === 'evaluador') {
      navigate('/evaluador');
    }

    if (user.currentRole === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  if (!user) return null;

  const isLoggedOnly = !user.roles || user.roles.length === 0;

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-amber-700 bg-amber-100 px-3 py-1 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            Pendiente
          </span>
        );
      case 'confirmed':
        return (
          <span className="flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            Confirmada
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-red-700 bg-red-100 px-3 py-1 rounded-full text-sm">
            <XCircle className="w-4 h-4" />
            Rechazada
          </span>
        );
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl text-gray-800 mb-2">
                Bienvenido, {user.name} {user.lastName}
              </h1>
              <p className="text-gray-600">{user.email}</p>

              <div className="mt-3 flex items-center gap-3">
                <span className="px-4 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {isLoggedOnly && 'Usuario Logueado'}
                  {user.currentRole === 'asistente' && 'Asistente'}
                  {user.currentRole === 'autor' && 'Autor'}
                </span>

                {user.inscriptionStatus && getStatusBadge(user.inscriptionStatus)}
              </div>
            </div>

            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <User className="w-5 h-5" />
              <span>Mi Perfil</span>
            </Link>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-lg">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Notificaciones</h3>
              <p className="text-blue-800 text-sm">
                {isLoggedOnly && 'Completa tu inscripción para convertirte en asistente del congreso.'}
                {user.currentRole === 'asistente' && 'Ya puedes acceder al programa completo y armar tu agenda.'}
                {user.currentRole === 'autor' && 'Tienes nuevos mensajes sobre tus trabajos presentados.'}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <h2 className="text-2xl text-gray-800 mb-4">Acciones Disponibles</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Usuario sin rol */}
          {isLoggedOnly && (
            <Link
              to="/inscripcion"
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
                  <CreditCard className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl text-gray-800">Inscripción al Congreso</h3>
              </div>
              <p className="text-gray-600">
                Inscríbete y realiza el pago para convertirte en asistente
              </p>
            </Link>
          )}

          {/* Asistente o Autor */}
          {(user.currentRole === 'asistente' || user.currentRole === 'autor') && (
            <>
              <Link
                to="/programa-general"
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl text-gray-800">Ver Programa</h3>
                </div>
              </Link>

              <Link
                to="/envio-trabajos"
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <FileText className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xl text-gray-800">Enviar Trabajo</h3>
                </div>
              </Link>
            </>
          )}

          {/* Autor */}
          {user.currentRole === 'autor' && (
            <Link
              to="/mis-presentaciones"
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Award className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl text-gray-800">Mis Presentaciones</h3>
              </div>
            </Link>
          )}
        </div>

        {/* Estado */}
        <div className="mt-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-8">
          <h3 className="text-2xl mb-4">Tu Estado en el Congreso</h3>

          {isLoggedOnly && (
            <p>Debes completar tu inscripción para participar.</p>
          )}

          {user.currentRole === 'asistente' && (
            <p>Ya puedes acceder a todas las actividades del congreso.</p>
          )}

          {user.currentRole === 'autor' && (
            <p>Además de asistir, puedes presentar trabajos.</p>
          )}
        </div>

      </div>
    </div>
  );
}