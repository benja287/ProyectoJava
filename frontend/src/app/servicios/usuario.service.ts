/**
 * Cliente HTTP para el recurso REST /api/usuarios.
 * Todos los métodos devuelven Observable: el HTTP se ejecuta al hacer .subscribe()
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PaginaUsuarios, RolesRequest, Usuario, ActualizarPerfilRequest } from '../models/usuario.model';
import { buildListHttpParams } from '../utils/filtro-params.util';

export interface UsuarioListFiltro {
  apellido?: string;
  nombre?: string;
  email?: string;
  /** 'true' | 'false' — filtra por eje temático asignado */
  esEvaluador?: string;
  ejeTematico?: string;
  activo?: string;
}

const USUARIO_FILTER_KEYS = [
  'apellido',
  'nombre',
  'email',
  'esEvaluador',
  'ejeTematico',
  'activo',
] as const;

export interface UsuarioAltaPayload {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  roles: string[];
  rolActual: string;
  categoriaInscripcion?: string | null;
  activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  /** URL base según environment (proxy, CORS o producción) */
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  /** GET /api/usuarios?page=&size=&apellido=&nombre=&email= — items only (pickers). */
  listar(page = 1, size = 50, filtro: UsuarioListFiltro = {}): Observable<Usuario[]> {
    return this.listarPagina(page, size, filtro).pipe(map((p) => p.items));
  }

  /** Listado paginado con metadata. */
  listarPagina(
    page = 1,
    size = 20,
    filtro: UsuarioListFiltro = {}
  ): Observable<PaginaUsuarios> {
    const params = buildListHttpParams(page, size, filtro, USUARIO_FILTER_KEYS);
    return this.http.get<PaginaUsuarios>(this.baseUrl, { params });
  }

  /** GET /api/usuarios/{id} */
  buscarPorId(id: number): Observable<Usuario | undefined> {
    return this.http.get<Usuario>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => throwError(() => new Error('Usuario no encontrado')))
    );
  }

  /** GET /api/usuarios/me */
  miPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/me`);
  }

  /** PUT /api/usuarios/me — solo datos personales del usuario autenticado */
  actualizarMiPerfil(payload: ActualizarPerfilRequest): Observable<Usuario> {
    const body: ActualizarPerfilRequest = {
      nombre: payload.nombre.trim(),
      apellido: payload.apellido.trim(),
      email: payload.email.trim(),
    };
    const actual = payload.passwordActual?.trim();
    const nueva = payload.passwordNueva?.trim();
    if (nueva) {
      body.passwordNueva = nueva;
      body.passwordActual = actual ?? '';
    }
    return this.http.put<Usuario>(`${this.baseUrl}/me`, body);
  }

  /** POST /api/usuarios */
  alta(payload: UsuarioAltaPayload): Observable<Usuario> {
    const body: Record<string, unknown> = {
      nombre: payload.nombre,
      apellido: payload.apellido,
      email: payload.email,
      password: payload.password,
      activo: payload.activo ?? true,
      roles: payload.roles,
      rolActual: payload.rolActual,
    };
    const categoria = payload.categoriaInscripcion?.trim();
    if (categoria) {
      body['categoriaInscripcion'] = categoria;
    }
    return this.http.post<Usuario>(this.baseUrl, body);
  }

  /** PUT /api/usuarios/{id} */
  modificar(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
    const body: Record<string, string> = {
      nombre: usuario.nombre ?? '',
      apellido: usuario.apellido ?? '',
      email: usuario.email ?? '',
    };
    const pwd = usuario.password?.trim();
    if (pwd) {
      body['password'] = pwd;
    }
    return this.http.put<Usuario>(`${this.baseUrl}/${id}`, body);
  }

  /** PUT /api/usuarios/{id}/activo */
  setActivo(id: number, activo: boolean): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}/activo`, { activo });
  }

  /** DELETE /api/usuarios/{id} */
  baja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** PUT /api/usuarios/{id}/roles — usado por LoginService.cambiarRolActual */
  asignarRoles(id: number, request: RolesRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}/roles`, request);
  }

  /** PUT /api/usuarios/{id}/promover-evaluador */
  promoverEvaluador(id: number): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}/promover-evaluador`, {});
  }

  promoverAutor(id: number): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}/promover-autor`, {});
  }

  asignarEvaluadorEje(id: number, ejeTematico: string): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}/evaluador-eje`, { ejeTematico });
  }

  quitarEvaluadorEje(id: number): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.baseUrl}/${id}/evaluador-eje`);
  }
}
