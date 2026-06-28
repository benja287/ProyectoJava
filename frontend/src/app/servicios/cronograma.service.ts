import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cronograma } from '../models/cronograma.model';

@Injectable({ providedIn: 'root' })
export class CronogramaService {
  private readonly baseUrl = `${environment.apiUrl}/cronograma`;

  constructor(private http: HttpClient) {}

  obtener(usuarioId: number): Observable<Cronograma> {
    return this.http.get<Cronograma>(`${this.baseUrl}/${usuarioId}`);
  }

  agregarActividad(usuarioId: number, actividadId: number): Observable<Cronograma> {
    return this.http.post<Cronograma>(
      `${this.baseUrl}/${usuarioId}/actividades/${actividadId}`,
      {}
    );
  }

  quitarActividad(usuarioId: number, actividadId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${usuarioId}/actividades/${actividadId}`);
  }
}
