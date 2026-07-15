import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  LimpiezaNotificacionResult,
  Notificacion,
  NotificacionResumen,
} from '../models/notificacion.model';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly baseUrl = `${environment.apiUrl}/notificaciones`;
  private readonly adminUrl = `${environment.apiUrl}/admin/notificaciones`;

  constructor(private http: HttpClient) {}

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

  resumenAdmin(): Observable<NotificacionResumen> {
    return this.http.get<NotificacionResumen>(`${this.adminUrl}/resumen`);
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
