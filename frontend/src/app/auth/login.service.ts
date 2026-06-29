import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Usuario } from '../models/usuario.model';
import { UsuarioService } from '../servicios/usuario.service';

const STORAGE_KEY = 'jyaa_usuario';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private usuario: Usuario | null = null;

  constructor(
    private http: HttpClient,
    private usuarioService: UsuarioService
  ) {
    this.usuario = this.loadFromStorage();
  }

  login(email: string, password: string): Observable<Usuario> {
    return this.http
      .post<Usuario>(`${environment.apiUrl}/login`, { email, password })
      .pipe(tap((u) => this.setUser(u)));
  }

  logout(): void {
    this.usuario = null;
    sessionStorage.removeItem(STORAGE_KEY);
  }

  getUser(): Usuario | null {
    return this.usuario;
  }

  isLogged(): boolean {
    return this.usuario != null;
  }

  hasRole(role: string): boolean {
    if (!this.usuario) {
      return false;
    }
    return (
      this.usuario.roles?.includes(role) === true || this.usuario.rolActual === role
    );
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((r) => this.hasRole(r));
  }

  homeRoute(): string {
    switch (this.usuario?.rolActual) {
      case 'ADMINISTRADOR':
        return '/admin';
      case 'ORGANIZADOR_CIENTIFICO':
        return '/organizador';
      case 'EVALUADOR':
        return '/evaluador';
      case 'AUTOR':
        return '/autor';
      case 'PARTICIPANTE':
        return '/participante';
      default:
        return '/';
    }
  }

  tieneVariosRoles(): boolean {
    return (this.usuario?.roles?.length ?? 0) > 1;
  }

  /** Tras login: siempre pedir perfil si hay más de un rol (como React). */
  rutaTrasLogin(): string {
    return this.tieneVariosRoles() ? '/seleccion-rol' : this.homeRoute();
  }

  /** Panel según rolActual; si faltó elegir perfil, vuelve a la selección. */
  rutaPanel(): string {
    if (this.tieneVariosRoles() && !this.usuario?.rolActual) {
      return '/seleccion-rol';
    }
    return this.homeRoute();
  }

  /** Borra rolActual solo en sesión para forzar elección tras login (como React). */
  limpiarRolActualLocal(): void {
    if (!this.usuario) {
      return;
    }
    this.usuario = { ...this.usuario, rolActual: null };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.usuario));
  }

  /** Recarga roles/datos desde GET /api/usuarios/{id} (ej. tras promoción a Autor). */
  refreshUser(): Observable<Usuario> {
    const id = this.usuario?.id;
    if (!id) {
      return throwError(() => new Error('Sin sesión'));
    }
    const rolActualPrevio = this.usuario?.rolActual;
    return this.usuarioService.buscarPorId(id).pipe(
      switchMap((u) => {
        if (!u) {
          return throwError(() => new Error('Usuario no encontrado'));
        }
        const roles = u.roles ?? [];
        const rolActual =
          rolActualPrevio && roles.includes(rolActualPrevio)
            ? rolActualPrevio
            : (u.rolActual ?? roles[0] ?? null);
        const actualizado: Usuario = { ...u, rolActual };
        this.setUser(actualizado);
        return of(actualizado);
      })
    );
  }

  /** Cambia rolActual usando PUT /api/usuarios/{id}/roles (sin endpoint nuevo). */
  cambiarRolActual(rol: string): Observable<Usuario> {
    const u = this.usuario;
    if (!u?.id || !u.roles?.includes(rol)) {
      return throwError(() => new Error('Rol no permitido para este usuario'));
    }
    return this.usuarioService
      .asignarRoles(u.id, { roles: [...u.roles], rolActual: rol })
      .pipe(tap((actualizado) => this.setUser(actualizado)));
  }

  private setUser(u: Usuario): void {
    this.usuario = u;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }

  private loadFromStorage(): Usuario | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  }
}
