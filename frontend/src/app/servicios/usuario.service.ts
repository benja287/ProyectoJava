import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PaginaUsuarios, Usuario, UsuarioApi } from '../models/usuario.model';
import { UsuarioMockService } from './usuario-mock.service';

/**
 * Etapa 2 de la Práctica 8: misma API que UsuarioMockService pero con métodos de
 * instancia e inyección Angular. Si environment.useMock es true usa el mock;
 * si no, llama a los endpoints REST de Entrega 4.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  listar(page = 1, size = 50): Observable<Usuario[]> {
    if (environment.useMock) {
      return of(UsuarioMockService.listar());
    }
    return this.http
      .get<PaginaUsuarios>(`${this.baseUrl}?page=${page}&size=${size}`)
      .pipe(map((pagina) => pagina.items.map((u) => this.fromApi(u))));
  }

  buscarPorId(id: number): Observable<Usuario | undefined> {
    if (environment.useMock) {
      return of(UsuarioMockService.buscarPorId(id));
    }
    return this.http.get<UsuarioApi>(`${this.baseUrl}/${id}`).pipe(
      map((u) => this.fromApi(u)),
      catchError(() => of(undefined))
    );
  }

  alta(usuario: Usuario): Observable<Usuario> {
    if (environment.useMock) {
      return of(UsuarioMockService.alta(usuario));
    }
    const body = {
      nombre: usuario.nombres,
      apellido: usuario.apellido,
      email: usuario.email,
      password: usuario.password ?? '12345678',
      activo: true,
    };
    return this.http.post<UsuarioApi>(this.baseUrl, body).pipe(
      map((creado) => this.fromApi(creado)),
      catchError((err) => throwError(() => err))
    );
  }

  modificar(id: number, usuario: Partial<Usuario>): Observable<Usuario | undefined> {
    if (environment.useMock) {
      return of(UsuarioMockService.modificar(id, usuario));
    }
    const body = {
      nombre: usuario.nombres,
      apellido: usuario.apellido,
      email: usuario.email,
    };
    return this.http.put<UsuarioApi>(`${this.baseUrl}/${id}`, body).pipe(
      map((u) => this.fromApi(u)),
      catchError(() => of(undefined))
    );
  }

  setActivo(id: number, activo: boolean): Observable<Usuario | undefined> {
    if (environment.useMock) {
      return of(UsuarioMockService.setActivo(id, activo));
    }
    return this.http
      .put<UsuarioApi>(`${this.baseUrl}/${id}/activo`, { activo })
      .pipe(
        map((u) => this.fromApi(u)),
        catchError(() => of(undefined))
      );
  }

  baja(id: number): Observable<boolean> {
    if (environment.useMock) {
      return of(UsuarioMockService.baja(id));
    }
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  private fromApi(api: UsuarioApi): Usuario {
    return {
      id: api.id,
      dni: '',
      apellido: api.apellido,
      nombres: api.nombre,
      domicilio: '',
      genero: '',
      email: api.email,
      activo: api.activo,
      roles: api.roles,
      rolActual: api.rolActual ?? undefined,
    };
  }
}
