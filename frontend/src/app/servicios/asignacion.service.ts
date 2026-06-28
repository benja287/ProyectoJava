import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AsignacionEvaluacion,
  AsignacionRequest,
} from '../models/asignacion.model';

@Injectable({ providedIn: 'root' })
export class AsignacionService {
  private readonly baseUrl = `${environment.apiUrl}/asignaciones-evaluacion`;

  constructor(private http: HttpClient) {}

  listarPorEvaluador(evaluadorId: number): Observable<AsignacionEvaluacion[]> {
    return this.http.get<AsignacionEvaluacion[]>(
      `${this.baseUrl}?evaluadorId=${evaluadorId}`
    );
  }

  listarPorTrabajo(trabajoId: number): Observable<AsignacionEvaluacion[]> {
    return this.http.get<AsignacionEvaluacion[]>(
      `${this.baseUrl}?trabajoId=${trabajoId}`
    );
  }

  asignar(request: AsignacionRequest): Observable<AsignacionEvaluacion> {
    return this.http.post<AsignacionEvaluacion>(this.baseUrl, request);
  }

  desasignar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  responder(id: number, aceptar: boolean): Observable<AsignacionEvaluacion> {
    return this.http.put<AsignacionEvaluacion>(`${this.baseUrl}/${id}/respuesta`, {
      aceptar,
    });
  }
}
