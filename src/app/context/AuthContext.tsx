import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DEMO_SEED_USERS, EXTRA_SEED_USERS } from '../constants/demoSeedUsers';

export type UserRole = 'asistente' | 'autor' | 'evaluador' | 'comite' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  roles: UserRole[];
  currentRole?: UserRole;
  inscriptionStatus?: 'pending' | 'confirmed' | 'rejected';
  /** Transferencia con comprobante, o efectivo / presencial (sin archivo; valida admin). */
  inscriptionPaymentMethod?: 'transfer' | 'cash';
  /** Si el asistente pidió factura al inscribirse. */
  inscriptionRequiresInvoice?: boolean;
  /** Solo efectivo: fecha ISO en que un admin aprobó constando el cobro en caja/recepción. */
  inscriptionCashValidatedAt?: string;
  /** Solo efectivo: nombre o email del admin que confirmó el cobro (texto libre). */
  inscriptionCashValidatedByLabel?: string;
  category?: InscriptionCategory;
  institution?: string;
  province?: string;
  /** Ejes temáticos en los que el evaluador está especializado. */
  axes?: string[];
  categoryCertificate?: string;
  categoryCertificateFileId?: string;
  categoryCertificateFileSize?: number;
  categoryCertificateMimeType?: string;
  /** Generado al aprobar inscripción (admin): comprobante / acreditación */
  inscriptionInvoiceId?: string;
  inscriptionInvoiceIssuedAt?: string;
  inscriptionAccreditationToken?: string;
  inscriptionInvoiceAmountLabel?: string;
  inscriptionInvoiceCategoryLabel?: string;
  /**
   * Si es `false`, la cuenta fue deshabilitada por un administrador: no puede iniciar sesión
   * hasta que la reactiven. Omitido o `true` = cuenta habilitada.
   */
  accountActive?: boolean;
}

export type InscriptionCategory =
  | 'socio_saae'
  | 'no_socio'
  | 'estudiante'
  | 'productor'
  | 'investigador'
  | 'extensionista'
  | 'docente'
  | 'extranjero';

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
  login: (email: string, password: string) => Promise<{
    success: boolean;
    needsRoleSelection?: boolean;
    accountDisabled?: boolean;
  }>;
  register: (
    email: string,
    password: string,
    name: string,
    lastName: string,
    category: InscriptionCategory
  ) => Promise<boolean>;
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
function upsertSeedUsers(list: any[], seeds: Record<string, unknown>[]): { next: any[]; changed: boolean } {
  let changed = false;
  const next = [...list];
  for (const seed of seeds) {
    const id = seed.id as string;
    const email = String(seed.email || '').toLowerCase();
    const i = next.findIndex(
      (u: any) => u?.id === id || String(u?.email || '').toLowerCase() === email
    );
    if (i === -1) {
      next.push({ ...seed });
      changed = true;
      continue;
    }
    const cur = next[i];
    const merged = {
      ...cur,
      ...seed,
      roles: [...(seed.roles as UserRole[])],
      accountActive: true,
    };
    const rolesEqual =
      Array.isArray(cur.roles) &&
      Array.isArray(merged.roles) &&
      cur.roles.length === merged.roles.length &&
      cur.roles.every((r: string, j: number) => r === merged.roles[j]);
    const needUpdate =
      cur.email !== merged.email ||
      cur.password !== merged.password ||
      !rolesEqual ||
      cur.accountActive === false;
    if (needUpdate) {
      next[i] = merged;
      changed = true;
    }
  }
  return { next, changed };
}

// Cada usuario tiene su propia key de notificaciones
// formato: congress_notifications_{userId}
const getUserNotificationsKey = (userId: string) => `congress_notifications_${userId}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    let users: any[] = [];
    try {
      const raw = localStorage.getItem(USERS_KEY) || '[]';
      const parsed = JSON.parse(raw);
      users = Array.isArray(parsed) ? parsed : [];
    } catch {
      users = [];
    }

    const afterDemo = upsertSeedUsers(users, DEMO_SEED_USERS);
    const afterExtra = upsertSeedUsers(afterDemo.next, EXTRA_SEED_USERS);
    if (afterDemo.changed || afterExtra.changed) {
      localStorage.setItem(USERS_KEY, JSON.stringify(afterExtra.next));
    }
    // Importante: no volver a pushear usuarios demo acá.
    // Las cuentas de demo/equipo se gestionan por `DEMO_SEED_USERS` + `ensureDemoSeedUsers`,
    // que es idempotente (no duplica registros al reiniciar el servidor).

    // Cargar usuario logueado — sin cambios
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      const list = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const fresh = list.find((u: any) => u.id === parsedUser.id);
      if (fresh && fresh.accountActive === false) {
        localStorage.removeItem('current_user');
        setUser(null);
      } else {
        setUser(parsedUser);
        const userNotifs = localStorage.getItem(getUserNotificationsKey(parsedUser.id));
        if (userNotifs) {
          setNotifications(JSON.parse(userNotifs));
        }
      }
    }
  }, []);

  // Cierra sesión si la cuenta pasó a deshabilitada (otra pestaña admin o enfoque de ventana)
  useEffect(() => {
    const validateSession = () => {
      const saved = localStorage.getItem('current_user');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      const list = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const fresh = list.find((u: any) => u.id === parsed.id);
      if (fresh && fresh.accountActive === false) {
        localStorage.removeItem('current_user');
        setUser(null);
        setNotifications([]);
      }
    };
    window.addEventListener('focus', validateSession);
    const onStorage = (e: StorageEvent) => {
      if (e.key === USERS_KEY) validateSession();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', validateSession);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; needsRoleSelection?: boolean; accountDisabled?: boolean }> => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const norm = email.trim().toLowerCase();
    const foundUser = users.find(
      (u: any) => u.email?.toLowerCase?.() === norm && u.password === password
    );

    if (foundUser) {
      if (foundUser.accountActive === false) {
        return { success: false, accountDisabled: true };
      }

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

  // register
  const register = async (
    email: string,
    password: string,
    name: string,
    lastName: string,
    category: InscriptionCategory
  ): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.some((u: any) => u.email?.toLowerCase?.() === email.trim().toLowerCase())) return false;

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      lastName,
      category,
      roles: [] as UserRole[],
      accountActive: true,
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
      if (u.accountActive === false) return false;
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