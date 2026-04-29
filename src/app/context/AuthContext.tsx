import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'asistente' | 'autor' | 'evaluador' | 'comite' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  roles: UserRole[];
  currentRole?: UserRole;
  inscriptionStatus?: 'pending' | 'confirmed' | 'rejected';
  institution?: string;
  province?: string;
  /** Ejes temáticos en los que el evaluador está especializado. */
  axes?: string[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  origin: string;
}

interface AuthContextType {
  user: User | null;
  notifications: Notification[];
  login: (email: string, password: string) => Promise<{ success: boolean; needsRoleSelection?: boolean }>;
  register: (email: string, password: string, name: string, lastName: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  selectRole: (role: UserRole) => void;
  markNotificationRead: (id: string) => void;
  sendNotificationToUser: (userId: string, title: string, message: string, origin?: string) => void;
  // NUEVO: envía notificación a todos los usuarios o filtrado por rol
  sendNotificationToAll: (title: string, message: string, role?: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = 'congress_users';

// Cada usuario tiene su propia key de notificaciones
// formato: congress_notifications_{userId}
const getUserNotificationsKey = (userId: string) => `congress_notifications_${userId}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Crear admin si no existe — sin cambios
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const adminExists = users.some((u: any) => u.roles?.includes('admin'));
    if (!adminExists) {
      const adminUser = {
        id: 'admin-1',
        email: 'alexisadmin@gmail.com',
        password: '12345678',
        name: 'Admin',
        lastName: 'Principal',
        roles: ['admin'],
      };
      users.push(adminUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    // Crear Administrador Comité académico si no existe
    const comiteExists = users.some((u: any) => u.roles?.includes('comite'));
    if (!comiteExists) {
      const comiteUser = {
        id: 'comite-1',
        email: 'comiteacademico@gmail.com',
        password: '12345678',
        name: 'Comité',
        lastName: 'Académico',
        roles: ['comite'],
      };
      users.push(comiteUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    // Cargar usuario logueado — sin cambios
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Carga las notificaciones propias del usuario logueado
      const userNotifs = localStorage.getItem(getUserNotificationsKey(parsedUser.id));
      if (userNotifs) {
        setNotifications(JSON.parse(userNotifs));
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; needsRoleSelection?: boolean }> => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const foundUser = users.find((u: any) => u.email === email && u.password === password);

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;

      if (userWithoutPassword.roles && userWithoutPassword.roles.length > 1) {
        setUser(userWithoutPassword);
        localStorage.setItem('current_user', JSON.stringify(userWithoutPassword));
        // Carga notificaciones del usuario al loguear
        const userNotifs = localStorage.getItem(getUserNotificationsKey(userWithoutPassword.id));
        setNotifications(userNotifs ? JSON.parse(userNotifs) : []);
        return { success: true, needsRoleSelection: true };
      }

      const roleToSet = userWithoutPassword.roles?.[0];
      const userWithRole = { ...userWithoutPassword, currentRole: roleToSet };
      setUser(userWithRole);
      localStorage.setItem('current_user', JSON.stringify(userWithRole));
      // Carga notificaciones del usuario al loguear
      const userNotifs = localStorage.getItem(getUserNotificationsKey(userWithRole.id));
      setNotifications(userNotifs ? JSON.parse(userNotifs) : []);
      return { success: true, needsRoleSelection: false };
    }
    return { success: false };
  };

  // register — sin cambios
  const register = async (email: string, password: string, name: string, lastName: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.some((u: any) => u.email === email)) return false;

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      lastName,
      roles: [] as UserRole[],
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('current_user', JSON.stringify(userWithoutPassword));
    return true;
  };

  // logout — sin cambios
  const logout = () => {
    setUser(null);
    setNotifications([]);
    localStorage.removeItem('current_user');
  };

  // updateUser — sin cambios
  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('current_user', JSON.stringify(updatedUser));

      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const index = users.findIndex((u: any) => u.id === user.id);
      if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }
  };

  // selectRole — sin cambios
  const selectRole = (role: UserRole) => {
    if (user && user.roles.includes(role)) {
      const updatedUser = { ...user, currentRole: role };
      setUser(updatedUser);
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
    }
  };

  // markNotificationRead — guarda en key propia del usuario logueado
  const markNotificationRead = (id: string) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    if (user) {
      localStorage.setItem(getUserNotificationsKey(user.id), JSON.stringify(updated));
    }
  };

  // sendNotificationToUser — escribe en la key del usuario destino
  // origin es opcional para permitir distintos emisores (evaluador/admin).
  const sendNotificationToUser = (userId: string, title: string, message: string, origin: string = 'Comité Evaluador') => {
    const key = getUserNotificationsKey(userId);
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const newNotification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      date: new Date().toLocaleDateString('es-AR'),
      read: false,
      origin,
    };
    localStorage.setItem(key, JSON.stringify([...existing, newNotification]));
  };

  // NUEVO: envía notificación a todos los usuarios o solo a los que tienen un rol específico
  // si role es undefined → va a todos
  // si role es 'asistente', 'autor' o 'evaluador' → solo a los que tienen ese rol en su array de roles
  // el admin que envía no se notifica a sí mismo
  const sendNotificationToAll = (title: string, message: string, role?: UserRole) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

    // Filtra destinatarios según si se eligió un rol o todos
    const targets = users.filter((u: any) => {
      if (u.id === user?.id) return false; // el admin no se notifica a sí mismo
      if (role) {
        return u.roles?.includes(role); // solo los que tienen ese rol
      }
      return true; // todos los demás
    });

    const date = new Date().toLocaleDateString('es-AR');

    // Escribe la notificación en la key de cada destinatario
    targets.forEach((u: any) => {
      const key = getUserNotificationsKey(u.id);
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const newNotification: Notification = {
        id: `${Date.now()}-${u.id}`, // id único por usuario para evitar colisiones
        title,
        message,
        date,
        read: false,
        origin: 'Organización del Congreso', // origen claro para el destinatario
      };
      localStorage.setItem(key, JSON.stringify([...existing, newNotification]));
    });

    return targets.length; // devuelve cuántos usuarios recibieron la notificación
  };

  return (
    <AuthContext.Provider value={{
      user,
      notifications,
      login,
      register,
      logout,
      updateUser,
      selectRole,
      markNotificationRead,
      sendNotificationToUser,
      sendNotificationToAll, // NUEVO: expuesto para PanelAdmin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}