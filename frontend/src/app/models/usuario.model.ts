/** Modelo de la Práctica 8 (campos del formulario de registro). */
export interface Usuario {
  id?: number;
  dni: string;
  apellido: string;
  nombres: string;
  domicilio: string;
  genero: string;
  email: string;
  password?: string;
  activo?: boolean;
  roles?: string[];
  rolActual?: string;
}

/** Respuesta paginada de GET /api/usuarios (espejo de PaginaUsuariosDTO). */
export interface PaginaUsuarios {
  items: UsuarioApi[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

/** Espejo de UsuarioDTO del backend Java. */
export interface UsuarioApi {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  roles: string[];
  rolActual: string | null;
  activo: boolean;
}
