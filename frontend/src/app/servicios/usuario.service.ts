import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PaginaUsuarios, RolesRequest, Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  listar(page = 1, size = 50): Observable<Usuario[]> {
    return this.http
      .get<PaginaUsuarios>(`${this.baseUrl}?page=${page}&size=${size}`)
      .pipe(map((pagina) => pagina.items));
  }

  buscarPorId(id: number): Observable<Usuario | undefined> {
    return this.http.get<Usuario>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => throwError(() => new Error('Usuario no encontrado')))
    );
  }

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

  modificar(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
    const body = {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
    };
    return this.http.put<Usuario>(`${this.baseUrl}/${id}`, body);
  }

  setActivo(id: number, activo: boolean): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}/activo`, { activo });
  }

  baja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  asignarRoles(id: number, request: RolesRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}/roles`, request);
  }

  promoverEvaluador(id: number): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}/promover-evaluador`, {});
  }
}
