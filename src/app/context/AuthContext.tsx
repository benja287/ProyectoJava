import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'asistente' | 'autor' | 'evaluador' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  roles: UserRole[]; // Multiple roles support
  currentRole?: UserRole; // Active role
  inscriptionStatus?: 'pending' | 'confirmed' | 'rejected';
  institution?: string;
  province?: string;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = 'congress_users';
const NOTIFICATIONS_KEY = 'congress_notifications';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // 🔴 Crear admin si no existe
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
  
    // 🔵 Tu código original
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    const savedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; needsRoleSelection?: boolean }> => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const foundUser = users.find((u: any) => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      
      // Check if user has multiple roles
      if (userWithoutPassword.roles && userWithoutPassword.roles.length > 1) {
        // Save user without current role, requiring selection
        setUser(userWithoutPassword);
        localStorage.setItem('current_user', JSON.stringify(userWithoutPassword));
        return { success: true, needsRoleSelection: true };
      }
      
      const roleToSet = userWithoutPassword.roles?.[0];
const userWithRole = { ...userWithoutPassword, currentRole: roleToSet };
      setUser(userWithRole);
      localStorage.setItem('current_user', JSON.stringify(userWithRole));
      return { success: true, needsRoleSelection: false };
    }
    return { success: false };
  };

  const register = async (email: string, password: string, name: string, lastName: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    if (users.some((u: any) => u.email === email)) {
      return false;
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      lastName,
      roles: [] as UserRole[], // Start with no roles until inscription is confirmed
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('current_user', JSON.stringify(userWithoutPassword));
    
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('current_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
      
      // Update in users list
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const index = users.findIndex((u: any) => u.id === user.id);
      if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }
  };

  const selectRole = (role: UserRole) => {
    if (user && user.roles.includes(role)) {
      const updatedUser = { ...user, currentRole: role };
      setUser(updatedUser);
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
    }
  };

  const markNotificationRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
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
      markNotificationRead
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
