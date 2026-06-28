import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Actividad, PaginaActividades } from '../models/actividad.model';

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly baseUrl = `${environment.apiUrl}/actividades`;

  constructor(private http: HttpClient) {}

  listar(page = 1, size = 50): Observable<Actividad[]> {
    return this.http
      .get<PaginaActividades>(`${this.baseUrl}?page=${page}&size=${size}`)
      .pipe(map((p) => p.items));
  }

  buscar(id: number): Observable<Actividad> {
    return this.http.get<Actividad>(`${this.baseUrl}/${id}`);
  }

  alta(actividad: Actividad): Observable<Actividad> {
    return this.http.post<Actividad>(this.baseUrl, actividad);
  }

  modificar(id: number, actividad: Actividad): Observable<Actividad> {
    return this.http.put<Actividad>(`${this.baseUrl}/${id}`, actividad);
  }

  baja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
