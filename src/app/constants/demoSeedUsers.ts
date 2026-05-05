import type { UserRole } from '../context/AuthContext';

/** Usuario inicial en localStorage para demo/equipo (misma forma que espera AuthContext). */
export type DemoSeedRecord = Record<string, unknown> & {
  id: string;
  email: string;
  roles: UserRole[];
};

/** Cuentas fijas por `id` para demo y equipo */
export const DEMO_SEED_USERS: DemoSeedRecord[] = [
  {
    id: 'admin-1',
    email: 'mantillabenja153@gmail.com',
    password: '12345678',
    name: 'Admin',
    lastName: 'Principal',
    roles: ['admin'],
    accountActive: true,
  },
  {
    id: 'comite-1',
    email: 'rodriguezmantilla123@gmail.com',
    password: '12345678',
    name: 'Comité',
    lastName: 'Académico',
    roles: ['comite'],
    accountActive: true,
  },
];

export const EXTRA_SEED_USERS: DemoSeedRecord[] = [
  {
    id: 'asistLucas',
    email: 'lucasbudnik@hotmail.com.ar',
    password: '12345678',
    name: 'Asistente',
    lastName: 'Principal',
    roles: ['asistente'],
    currentRole: 'asistente',
    inscriptionStatus: 'confirmed',
    institution: 'Instituto de Agroecologia',
    province: 'Buenos Aires',
    accountActive: true,
  },
  {
    id: 'evaluadorAlci',
    email: 'alci0483@gmail.com',
    password: '12345678',
    name: 'Evaluador',
    lastName: 'Principal',
    roles: ['evaluador'],
    accountActive: true,
  },
  {
    id: 'admin-2',
    email: 'admin2@gmail.com',
    password: '12345678',
    name: 'Admin',
    lastName: 'Secondary',
    roles: ['admin', 'asistente', 'autor', 'evaluador'],
    accountActive: true,
  },
];

const LOGIN_ORDER_IDS = ['admin-1', 'asistLucas', 'comite-1', 'evaluadorAlci', 'admin-2'] as const;

const ALL_SEED = [...DEMO_SEED_USERS, ...EXTRA_SEED_USERS];

/** Mismo orden que en Login (legend). */
export const DEMO_USERS_LOGIN_LIST: DemoSeedRecord[] = LOGIN_ORDER_IDS.map((id) => {
  const u = ALL_SEED.find((s) => s.id === id);
  if (!u) throw new Error(`demoSeedUsers: falta usuario ${id}`);
  return u;
});

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador/a',
  asistente: 'Asistente',
  autor: 'Autor/a',
  evaluador: 'Evaluador/a',
  comite: 'Comité académico',
};

export function formatRolesForLogin(roles: UserRole[]): string {
  return roles.map((r) => ROLE_LABEL[r]).join(', ');
}
