/** Espejo de UsuarioDTO del backend Java. */
export interface Usuario {
  id?: number;
  email: string;
  nombre: string;
  apellido: string;
  password?: string;
  activo?: boolean;
  roles?: string[];
  rolActual?: string | null;
}

export interface PaginaUsuarios {
  items: Usuario[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface RolesRequest {
  roles: string[];
  rolActual: string;
}
