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
  categoriaInscripcion?: string | null;
  ejeTematicoEvaluador?: string | null;
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

/** Respuesta de POST /api/login (LoginResponseDTO en Java). */
export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  usuario: Usuario;
}
