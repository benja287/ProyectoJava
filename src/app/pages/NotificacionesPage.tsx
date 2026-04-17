import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';
import { useEffect } from 'react';

export function NotificacionesPage() {
  const { user, notifications, markNotificationRead } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-8">
            <Bell className="w-10 h-10 text-[#2d5016]" />
            <div>
              <h1 className="text-3xl text-gray-800">Centro de Notificaciones</h1>
              <p className="text-gray-600">Tus mensajes y actualizaciones</p>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No tenés notificaciones nuevas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationRead(notif.id)}
                  className={`p-4 rounded-lg cursor-pointer transition ${
                    !notif.read ? 'bg-green-50 border-l-4 border-[#2d5016]' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium mb-1 ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                      <p className="text-xs text-gray-500">{notif.date} • {notif.origin}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
