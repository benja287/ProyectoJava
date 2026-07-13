import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PaginaPagos, Pago, ValidacionPagoRequest } from '../models/pago.model';
import { buildListHttpParams } from '../utils/filtro-params.util';

export interface PagoListFiltro {
  estado?: string;
  monto?: string | number;
  motivoRechazo?: string;
}

const PAGO_FILTER_KEYS = ['estado', 'monto', 'motivoRechazo'] as const;
const PAGO_PENDIENTE_FILTER_KEYS = ['monto', 'motivoRechazo'] as const;

@Injectable({ providedIn: 'root' })
export class PagoService {
  private readonly baseUrl = `${environment.apiUrl}/pagos`;

  constructor(private http: HttpClient) {}

  listarPendientes(page = 1, size = 50, filtro: PagoListFiltro = {}): Observable<Pago[]> {
    return this.listarPendientesPagina(page, size, filtro).pipe(map((p) => p.items));
  }

  listarPendientesPagina(
    page = 1,
    size = 20,
    filtro: PagoListFiltro = {}
  ): Observable<PaginaPagos> {
    const params = buildListHttpParams(page, size, filtro, PAGO_PENDIENTE_FILTER_KEYS);
    return this.http.get<PaginaPagos>(`${this.baseUrl}/pendientes`, { params });
  }

  listar(page = 1, size = 50, filtro: PagoListFiltro = {}): Observable<Pago[]> {
    return this.listarPagina(page, size, filtro).pipe(map((p) => p.items));
  }

  listarPagina(page = 1, size = 20, filtro: PagoListFiltro = {}): Observable<PaginaPagos> {
    const params = buildListHttpParams(page, size, filtro, PAGO_FILTER_KEYS);
    return this.http.get<PaginaPagos>(this.baseUrl, { params });
  }

  consultarEstadoPorUsuario(usuarioId: number): Observable<Pago> {
    return this.http.get<Pago>(`${this.baseUrl}/usuario/${usuarioId}/estado`);
  }

  /** GET /api/pagos/{id} */
  buscar(id: number): Observable<Pago> {
    return this.http.get<Pago>(`${this.baseUrl}/${id}`);
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

  baja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
