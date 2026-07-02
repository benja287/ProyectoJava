/**
 * Cliente HTTP para el recurso REST /api/usuarios.
 * Todos los métodos devuelven Observable: el HTTP se ejecuta al hacer .subscribe()
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PaginaUsuarios, RolesRequest, Usuario } from '../models/usuario.model';
import { buildListHttpParams } from '../utils/filtro-params.util';

export interface UsuarioListFiltro {
  apellido?: string;
  nombre?: string;
  email?: string;
}

const USUARIO_FILTER_KEYS = ['apellido', 'nombre', 'email'] as const;

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  /** URL base según environment (proxy, CORS o producción) */
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  /** GET /api/usuarios?page=&size=&apellido=&nombre=&email= */
  listar(page = 1, size = 50, filtro: UsuarioListFiltro = {}): Observable<Usuario[]> {
    const params = buildListHttpParams(page, size, filtro, USUARIO_FILTER_KEYS);
    return this.http
      .get<PaginaUsuarios>(this.baseUrl, { params })
      .pipe(map((pagina) => pagina.items));
  }

  /** GET /api/usuarios/{id} */
  buscarPorId(id: number): Observable<Usuario | undefined> {
    return this.http.get<Usuario>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => throwError(() => new Error('Usuario no encontrado')))
    );
  }

  /** POST /api/usuarios */
  alta(usuario: Usuario): Observable<Usuario> {
    const body = {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: usuario.password ?? '12345678',
      activo: true,
    };
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
}
