import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../models/usuario.model';

const STORAGE_KEY = 'jyaa_usuario';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private usuario: Usuario | null = null;

  constructor(private http: HttpClient) {
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
