import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  AsignacionEvaluacion,
  AsignacionRequest,
  PaginaAsignaciones,
  ResumenAsignacionesEvaluador,
} from '../models/asignacion.model';

@Injectable({ providedIn: 'root' })
export class AsignacionService {
  private readonly baseUrl = `${environment.apiUrl}/asignaciones-evaluacion`;

  constructor(private http: HttpClient) {}

  listarPorEvaluador(
    evaluadorId: number,
    page = 1,
    size = 500,
    soloPendientes = false
  ): Observable<AsignacionEvaluacion[]> {
    return this.listarPorEvaluadorPagina(evaluadorId, page, size, soloPendientes).pipe(
      map((p) => p.items)
    );
  }

  listarPorEvaluadorPagina(
    evaluadorId: number,
    page = 1,
    size = 20,
    soloPendientes = false
  ): Observable<PaginaAsignaciones> {
    let params = new HttpParams()
      .set('evaluadorId', String(evaluadorId))
      .set('page', String(page))
      .set('size', String(size));
    if (soloPendientes) {
      params = params.set('soloPendientes', 'true');
    }
    return this.http.get<PaginaAsignaciones>(this.baseUrl, { params });
  }

  resumenPorEvaluador(evaluadorId: number): Observable<ResumenAsignacionesEvaluador> {
    return this.http.get<ResumenAsignacionesEvaluador>(`${this.baseUrl}/resumen`, {
      params: { evaluadorId: String(evaluadorId) },
    });
  }

  listarPorTrabajo(trabajoId: number): Observable<AsignacionEvaluacion[]> {
    return this.http
      .get<PaginaAsignaciones>(this.baseUrl, {
        params: { trabajoId: String(trabajoId), page: '1', size: '50' },
      })
      .pipe(map((p) => p.items));
  }

  asignar(request: AsignacionRequest): Observable<AsignacionEvaluacion> {
    return this.http.post<AsignacionEvaluacion>(this.baseUrl, request);
  }

  asignarVarios(
    trabajoId: number,
    evaluadorIds: number[],
    tercerEvaluadorEmpate = false
  ): Observable<AsignacionEvaluacion[]> {
    return this.http.post<AsignacionEvaluacion[]>(`${this.baseUrl}/batch`, {
      trabajoId,
      evaluadorIds,
      tercerEvaluadorEmpate,
    });
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
