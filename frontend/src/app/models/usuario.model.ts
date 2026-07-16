/** Espejo de UsuarioDTO del backend Java. */
export interface EvaluadorEjeCupo {
  id?: number;
  ejeTematico: string;
  capacidadMax: number;
  restantes: number;
  activo?: boolean;
  /** Asignaciones sin dictamen que consumen cupo. */
  pendientesDictamen?: number;
}

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
  /** Cupos activos por eje (capacidad / restantes). */
  cuposEje?: EvaluadorEjeCupo[];
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

export interface ActualizarPerfilRequest {
  nombre: string;
  apellido: string;
  email: string;
  passwordActual?: string;
  passwordNueva?: string;
}

/** Respuesta de POST /api/login (LoginResponseDTO en Java). */
export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  usuario: Usuario;
}
