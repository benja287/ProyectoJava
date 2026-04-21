import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Sprout, Bell, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function Header() {
  const { user, logout, notifications, markNotificationRead } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false); // NUEVO: estado para el dropdown de notificaciones

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null); // NUEVO: ref para el dropdown de notificaciones

  const unreadCount = notifications.filter(n => !n.read).length;
  const orderedNotifications = [...notifications].reverse();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Cierra el dropdown de usuario si se clickea afuera
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      // NUEVO: Cierra el dropdown de notificaciones si se clickea afuera
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  return (
    <header className="bg-gradient-to-r from-[#2d5016] to-[#3d6b23] text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title — sin cambios */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition">
            <div className="bg-white/10 p-2 rounded-lg">
              <Sprout className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">V Congreso Argentino de Agroecología</h1>
              <p className="text-xs text-green-100">La Plata 2027</p>
            </div>
          </Link>

          {/* Navigation Links — sin cambios */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link to="/" className="px-3 py-2 text-sm hover:bg-white/10 rounded-lg transition">Inicio</Link>
            <Link to="/circulares" className="px-3 py-2 text-sm hover:bg-white/10 rounded-lg transition">Circulares</Link>
            <Link to="/actividades" className="px-3 py-2 text-sm hover:bg-white/10 rounded-lg transition">Actividades</Link>
            <Link to="/mapas" className="px-3 py-2 text-sm hover:bg-white/10 rounded-lg transition">Mapas</Link>
            <Link to="/feria" className="px-3 py-2 text-sm hover:bg-white/10 rounded-lg transition">Feria Agroecológica</Link>
            <Link to="/organizadores" className="px-3 py-2 text-sm hover:bg-white/10 rounded-lg transition">Organizadores</Link>
            <Link to="/contacto" className="px-3 py-2 text-sm hover:bg-white/10 rounded-lg transition">Contacto</Link>
            <Link to="/ProgramaCongreso" className="px-3 py-2 text-sm hover:bg-white/10 rounded-lg transition">Programa</Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login" className="px-4 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition">
                  Iniciar sesión
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm bg-white text-[#2d5016] hover:bg-green-50 rounded-lg transition font-medium">
                  Registrarse
                </Link>
              </>
            ) : (
              <>
                {/* NUEVO: Notifications dropdown — reemplaza el Link anterior */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowDropdown(false); // cierra el otro dropdown si estaba abierto
                    }}
                    className="relative hover:bg-white/10 p-2 rounded-lg transition"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Panel flotante de notificaciones */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl py-2 text-gray-800 max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">Notificaciones</p>
                        {unreadCount > 0 && (
                          <p className="text-xs text-green-700">{unreadCount} sin leer</p>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        // Escenario 2 HU-17: sin notificaciones
                        <div className="px-4 py-6 text-center">
                          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Aun no tenés notificaciones</p>
                        </div>
                      ) : (
                        // Escenario 1 HU-17: lista con leídas y no leídas diferenciadas
                        <div>
                          {orderedNotifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => markNotificationRead(notif.id)}
                              className={`px-4 py-3 cursor-pointer transition border-b border-gray-100 last:border-0 ${
                                !notif.read
                                  ? 'bg-green-50 border-l-4 border-l-[#2d5016]' // no leída: resaltada
                                  : 'hover:bg-gray-50'                            // leída: gris suave
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {/* NUEVO: punto indicador visual de no leída */}
                                {!notif.read && (
                                  <span className="mt-1.5 w-2 h-2 rounded-full bg-[#2d5016] flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                    {notif.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">{notif.date} • {notif.origin}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Dropdown — sin cambios */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      setShowDropdown(!showDropdown);
                      setShowNotifications(false); // cierra notificaciones si estaba abierto
                    }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition"
                  >
                    <span className="text-sm font-medium">{user.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 text-gray-800">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{user.name} {user.lastName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.currentRole && (
                          <p className="text-xs text-green-700 mt-1">
                            Rol actual: {
                              user.currentRole === 'asistente' ? 'Asistente' :
                              user.currentRole === 'autor' ? 'Autor' :
                              user.currentRole === 'evaluador' ? 'Evaluador' :
                              user.currentRole === 'admin' ? 'Administrador' : ''
                            }
                          </p>
                        )}
                      </div>
                      <Link to="/inscripcion" className="block px-4 py-2 text-sm hover:bg-gray-100 transition" onClick={() => setShowDropdown(false)}>
                        Mi perfil
                      </Link>
                      {user.roles && user.roles.length > 1 && (
                        <Link to="/select-role" className="block px-4 py-2 text-sm hover:bg-gray-100 transition" onClick={() => setShowDropdown(false)}>
                          Cambiar rol
                        </Link>
                      )}
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition">
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}