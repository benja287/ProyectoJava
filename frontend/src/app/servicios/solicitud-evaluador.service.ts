import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  PaginaSolicitudesEvaluador,
  SolicitudEvaluador,
  SolicitudEvaluadorCreateRequest,
  ValidarSolicitudEvaluadorRequest,
} from '../models/solicitud-evaluador.model';

@Injectable({ providedIn: 'root' })
export class SolicitudEvaluadorService {
  private readonly baseUrl = `${environment.apiUrl}/solicitudes-evaluador`;

  constructor(private http: HttpClient) {}

  mia(): Observable<SolicitudEvaluador | null> {
    return this.http.get<SolicitudEvaluador>(`${this.baseUrl}/mia`).pipe(
      catchError((err) => {
        if (err?.status === 204 || err?.status === 404) {
          return of(null);
        }
        throw err;
      }),
    );
  }

  crear(body: SolicitudEvaluadorCreateRequest): Observable<SolicitudEvaluador> {
    return this.http.post<SolicitudEvaluador>(this.baseUrl, body);
  }

  listar(page = 1, size = 20, estado?: string): Observable<PaginaSolicitudesEvaluador> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (estado?.trim()) {
      params = params.set('estado', estado.trim());
    }
    return this.http.get<PaginaSolicitudesEvaluador>(this.baseUrl, { params });
  }

  obtener(id: number): Observable<SolicitudEvaluador> {
    return this.http.get<SolicitudEvaluador>(`${this.baseUrl}/${id}`);
  }

  validar(id: number, body: ValidarSolicitudEvaluadorRequest): Observable<SolicitudEvaluador> {
    return this.http.put<SolicitudEvaluador>(`${this.baseUrl}/${id}/validar`, body);
  }

  invitarTaller(id: number): Observable<SolicitudEvaluador> {
    return this.http.post<SolicitudEvaluador>(`${this.baseUrl}/${id}/invitar-taller`, {});
  }
}
