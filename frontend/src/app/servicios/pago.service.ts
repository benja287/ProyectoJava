import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PaginaPagos, Pago, ValidacionPagoRequest } from '../models/pago.model';

@Injectable({ providedIn: 'root' })
export class PagoService {
  private readonly baseUrl = `${environment.apiUrl}/pagos`;

  constructor(private http: HttpClient) {}

  listarPendientes(page = 1, size = 50): Observable<Pago[]> {
    return this.http
      .get<PaginaPagos>(`${this.baseUrl}/pendientes?page=${page}&size=${size}`)
      .pipe(map((p) => p.items));
  }

  consultarEstadoPorUsuario(usuarioId: number): Observable<Pago> {
    return this.http.get<Pago>(`${this.baseUrl}/usuario/${usuarioId}/estado`);
  }

  registrar(usuarioId: number, pago: Pago): Observable<Pago> {
    return this.http.post<Pago>(this.baseUrl, { usuarioId, pago });
  }

  validar(id: number, request: ValidacionPagoRequest): Observable<{ pago: Pago; mensaje: string }> {
    return this.http.put<{ pago: Pago; mensaje: string }>(
      `${this.baseUrl}/${id}/validacion`,
      request
    );
  }

  adjuntarComprobante(id: number, file: File): Observable<Pago> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Pago>(`${this.baseUrl}/${id}/comprobante`, form);
  }
}
