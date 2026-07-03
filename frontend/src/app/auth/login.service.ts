/**
 * Servicio de sesión del cliente.
 * - Login/logout contra POST /api/login
 * - JWT en sessionStorage + usuario en memoria y sessionStorage
 * - El backend valida el Bearer en cada petición protegida
 */
import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { Observable, of, tap, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LoginResponse, Usuario } from '../models/usuario.model';
import { UsuarioService } from '../servicios/usuario.service';
import { IdleSessionService } from './idle-session.service';
import { isCuentaDeshabilitada } from '../utils/api-error.util';

/** Claves de sesión en sessionStorage (nunca usar sessionStorage.clear()). */
const STORAGE_KEY = 'jyaa_usuario';
const TOKEN_KEY = 'jyaa_token';

interface JwtPayload {
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  /** Copia en RAM del usuario; se restaura desde sessionStorage al arrancar */
  private usuario: Usuario | null = null;

  constructor(
    private http: HttpClient,
    private usuarioService: UsuarioService,
    private injector: Injector
  ) {}

  /**
   * Valida la sesión persistida al arranque (APP_INITIALIZER).
   * Si el token expiró o los datos están incompletos, limpia antes de renderizar.
   */
  initSessionFromStorage(): void {
    const usuario = this.readUsuarioFromStorage();
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!usuario && !token) {
      this.usuario = null;
      return;
    }

    // Sesión legacy (Entrega 5 sin JWT en backend): solo usuario en storage
    if (usuario && !token) {
      this.usuario = usuario;
      this.onSessionEstablished();
      return;
    }

    if (!usuario || !token || this.isJwtExpired(token, 0)) {
      this.logout();
      return;
    }

    this.usuario = usuario;
    this.onSessionEstablished();
  }

  /**
   * POST /api/login → guarda token JWT y usuario en sessionStorage.
   * Devuelve Observable: el HTTP solo se ejecuta al hacer .subscribe()
   */
  login(email: string, password: string): Observable<Usuario> {
    return this.http
      .post<LoginResponse | Usuario>(`${environment.apiUrl}/login`, { email, password })
      .pipe(
        map((res) => this.applyLoginResponse(res)),
        catchError((err) => {
          if (isCuentaDeshabilitada(err)) {
            this.logout();
          }
          return throwError(() => err);
        })
      );
  }

  /**
   * Punto único de cierre de sesión: detiene idle timer y limpia storage.
   * No redirige; la navegación la resuelve quien invoca (componente, interceptor, idle).
   */
  logout(): void {
    this.injector.get(IdleSessionService).clearIdleTimer();
    this.clearStoredSession();
  }

  private clearStoredSession(): void {
    this.usuario = null;
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }

  getUser(): Usuario | null {
    return this.usuario;
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  /**
   * true si no hay token, el payload es inválido o exp ya pasó.
   * bufferSeconds evita enviar un token a punto de vencer.
   */
  isTokenExpired(bufferSeconds = 30): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }
    return this.isJwtExpired(token, bufferSeconds);
  }

  isLogged(): boolean {
    if (!this.usuario) {
      return false;
    }
    const token = this.getToken();
    if (!token) {
      return true;
    }
    if (this.isTokenExpired()) {
      this.logout();
      return false;
    }
    return true;
  }

  /** ¿El usuario tiene este rol en su lista o como rolActual? */
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

  /** Ruta del panel según rolActual (/admin, /asistente, /inscripcion, etc.) */
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
      case 'ASISTENTE':
      case 'PARTICIPANTE':
        return '/asistente';
      default:
        break;
    }
    if (this.esAsistenteCongreso()) {
      return '/asistente';
    }
    if (this.isLogged() && !this.tieneRolOperativo()) {
      return '/inscripcion';
    }
    return '/';
  }

  /** Usuario inscripto y aprobado al congreso (rol asistente). */
  esAsistenteCongreso(): boolean {
    return this.hasAnyRole(['ASISTENTE', 'PARTICIPANTE']);
  }

  /** Tiene algún rol de panel (admin, autor, etc.) o asistente al congreso. */
  tieneRolOperativo(): boolean {
    const roles = this.usuario?.roles ?? [];
    return roles.length > 0;
  }

  /** Tras login: sin roles → inscripción; con roles → panel o selección de perfil. */
  rutaTrasLogin(): string {
    if (!this.tieneRolOperativo()) {
      return '/inscripcion';
    }
    return this.tieneVariosRoles() ? '/seleccion-rol' : this.homeRoute();
  }

  tieneVariosRoles(): boolean {
    return (this.usuario?.roles?.length ?? 0) > 1;
  }

  /** Si tiene varios roles y aún no eligió perfil → forzar /seleccion-rol */
  rutaPanel(): string {
    if (!this.tieneRolOperativo()) {
      return '/inscripcion';
    }
    if (this.tieneVariosRoles() && !this.usuario?.rolActual) {
      return '/seleccion-rol';
    }
    return this.homeRoute();
  }

  /**
   * Tras login multi-rol: borra rolActual solo en cliente
   * para obligar a elegir perfil en /seleccion-rol
   */
  limpiarRolActualLocal(): void {
    if (!this.usuario) {
      return;
    }
    this.usuario = { ...this.usuario, rolActual: null };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.usuario));
  }

  /** Recarga datos del usuario desde GET /api/usuarios/{id} */
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

  /** PUT /api/usuarios/{id}/roles — actualiza rolActual en backend y sesión local */
  cambiarRolActual(rol: string): Observable<Usuario> {
    const u = this.usuario;
    if (!u?.id || !u.roles?.includes(rol)) {
      return throwError(() => new Error('Rol no permitido para este usuario'));
    }
    return this.usuarioService
      .asignarRoles(u.id, { roles: [...u.roles], rolActual: rol })
      .pipe(tap((actualizado) => this.setUser(actualizado)));
  }

  /** Guarda en memoria RAM y en sessionStorage del navegador */
  private setUser(u: Usuario): void {
    this.usuario = u;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }

  private setToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Lee sessionStorage al restaurar sesión.
   * Si el JSON es inválido, devuelve null (initSessionFromStorage hará logout).
   */
  private readUsuarioFromStorage(): Usuario | null {
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

  private isJwtExpired(token: string, bufferSeconds: number): boolean {
    try {
      const { exp } = jwtDecode<JwtPayload>(token);
      if (exp == null) {
        return true;
      }
      return Date.now() >= exp * 1000 - bufferSeconds * 1000;
    } catch {
      return true;
    }
  }

  /** Arranca o reinicia el temporizador de inactividad tras login o restauración de sesión. */
  private onSessionEstablished(): void {
    this.injector.get(IdleSessionService).resetIdleTimer();
  }

  /** Soporta LoginResponseDTO (JWT) o UsuarioDTO plano (backend Entrega 5 legacy). */
  private applyLoginResponse(res: LoginResponse | Usuario): Usuario {
    if (this.isJwtLoginResponse(res)) {
      this.setToken(res.token);
      this.setUser(res.usuario);
      this.onSessionEstablished();
      return res.usuario;
    }
    this.setUser(res);
    this.onSessionEstablished();
    return res;
  }

  private isJwtLoginResponse(res: LoginResponse | Usuario): res is LoginResponse {
    const candidate = res as LoginResponse;
    return typeof candidate.token === 'string' && candidate.usuario != null;
  }
}
