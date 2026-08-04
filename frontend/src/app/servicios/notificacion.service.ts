import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  LimpiezaNotificacionResult,
  Notificacion,
  NotificacionAdmin,
  NotificacionResumen,
  PaginaNotificaciones,
} from '../models/notificacion.model';

export interface NotificacionAdminFiltro {
  leida?: boolean;
  destinatario?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly baseUrl = `${environment.apiUrl}/notificaciones`;
  private readonly adminUrl = `${environment.apiUrl}/admin/notificaciones`;
  private readonly badgeChanged = new Subject<void>();

  /** Emite cuando el badge del header debe refrescarse. */
  readonly badgeChanged$ = this.badgeChanged.asObservable();

  constructor(private http: HttpClient) {}

  avisarCambioBadge(): void {
    this.badgeChanged.next();
  }

  listar(page = 1, size = 30): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(this.baseUrl, {
      params: { page: String(page), size: String(size) },
    });
  }

  contarNoLeidas(): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.baseUrl}/no-leidas`);
  }

  marcarLeida(id: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/leida`, {});
  }

  marcarTodasLeidas(): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/marcar-todas-leidas`, {});
  }

  enviar(asunto: string, mensaje: string, rol?: string): Observable<{ enviadas: number }> {
    return this.http.post<{ enviadas: number }>(`${this.baseUrl}/enviar`, {
      asunto,
      mensaje,
      rol: rol ?? 'TODOS',
    });
  }

  listarAdmin(
    page = 1,
    size = 20,
    filtro: NotificacionAdminFiltro = {},
  ): Observable<PaginaNotificaciones> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (filtro.leida !== undefined && filtro.leida !== null) {
      params = params.set('leida', String(filtro.leida));
    }
    if (filtro.destinatario?.trim()) {
      params = params.set('destinatario', filtro.destinatario.trim());
    }
    return this.http.get<PaginaNotificaciones>(this.adminUrl, { params });
  }

  resumenAdmin(): Observable<NotificacionResumen> {
    return this.http.get<NotificacionResumen>(`${this.adminUrl}/resumen`);
  }

  obtenerAdmin(id: number): Observable<NotificacionAdmin> {
    return this.http.get<NotificacionAdmin>(`${this.adminUrl}/${id}`);
  }

  eliminarAdmin(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }

  limpiarAdmin(
    alcance: 'leidas' | 'antiguos' | 'todos',
    dias?: number,
  ): Observable<LimpiezaNotificacionResult> {
    let params = new HttpParams().set('alcance', alcance);
    if (dias != null && dias > 0) {
      params = params.set('dias', String(dias));
    }
    return this.http.delete<LimpiezaNotificacionResult>(this.adminUrl, { params });
  }
}
