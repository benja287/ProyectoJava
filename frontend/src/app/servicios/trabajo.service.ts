import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  PaginaTrabajos,
  PresentacionAutor,
  Trabajo,
  TrabajoCreateRequest,
  TrabajoEnvioResumen,
} from '../models/trabajo.model';
import { buildListHttpParams } from '../utils/filtro-params.util';

export interface TrabajoListFiltro {
  titulo?: string;
  resumen?: string;
  ejeTematico?: string;
  estado?: string;
  modalidad?: string;
  tipo?: string;
  autorId?: number;
}

const TRABAJO_FILTER_KEYS = [
  'titulo',
  'resumen',
  'ejeTematico',
  'estado',
  'modalidad',
  'tipo',
  'autorId',
] as const;

@Injectable({ providedIn: 'root' })
export class TrabajoService {
  private readonly baseUrl = `${environment.apiUrl}/trabajos`;

  constructor(private http: HttpClient) {}

  listar(page = 1, size = 50, filtro: TrabajoListFiltro = {}): Observable<Trabajo[]> {
    const params = buildListHttpParams(page, size, filtro, TRABAJO_FILTER_KEYS);
    return this.http.get<PaginaTrabajos>(this.baseUrl, { params }).pipe(map((p) => p.items));
  }

  listarComite(): Observable<Trabajo[]> {
    return this.http.get<Trabajo[]>(`${this.baseUrl}/comite`);
  }

  listarPropuestasTallerPendientes(): Observable<Trabajo[]> {
    return this.http.get<Trabajo[]>(`${this.baseUrl}/propuestas-taller/pendientes`);
  }

  evaluarPropuestaTaller(
    id: number,
    aprobar: boolean,
    comentario?: string
  ): Observable<Trabajo> {
    return this.http.put<Trabajo>(`${this.baseUrl}/${id}/evaluar-propuesta-taller`, {
      aprobar,
      comentario: comentario ?? null,
    });
  }

  listarAprobadosProgramables(modalidad: 'ORAL' | 'POSTER'): Observable<Trabajo[]> {
    return this.http.get<Trabajo[]>(`${this.baseUrl}/aprobados`, { params: { modalidad } });
  }

  resumenEnvio(autorId: number, rolEnvio: 'ASISTENTE' | 'AUTOR'): Observable<TrabajoEnvioResumen> {
    return this.http.get<TrabajoEnvioResumen>(`${this.baseUrl}/resumen-envio`, {
      params: { autorId, rolEnvio },
    });
  }

  listarPresentaciones(autorId: number): Observable<PresentacionAutor[]> {
    return this.http.get<PresentacionAutor[]>(`${this.baseUrl}/mis-presentaciones`, {
      params: { autorId },
    });
  }

  buscar(id: number): Observable<Trabajo> {
    return this.http.get<Trabajo>(`${this.baseUrl}/${id}`);
  }

  crear(request: TrabajoCreateRequest): Observable<Trabajo> {
    return this.http.post<Trabajo>(this.baseUrl, request);
  }

  modificar(
    id: number,
    datos: Partial<{
      titulo: string;
      resumen: string;
      ejeTematico: string;
      modalidad: string;
      tipo: string;
      coautores: string[];
    }>
  ): Observable<Trabajo> {
    return this.http.put<Trabajo>(`${this.baseUrl}/${id}`, datos);
  }

  enviar(id: number, rolEnvio?: string): Observable<Trabajo> {
    return this.http.put<Trabajo>(`${this.baseUrl}/${id}/enviar`, { rolEnvio: rolEnvio ?? null });
  }

  precheck(id: number, apto: boolean, observaciones?: string): Observable<Trabajo> {
    return this.http.put<Trabajo>(`${this.baseUrl}/${id}/precheck`, {
      apto,
      observaciones: observaciones ?? null,
    });
  }

  confirmarComite(id: number, aprobar: boolean, observaciones?: string): Observable<Trabajo> {
    return this.http.put<Trabajo>(`${this.baseUrl}/${id}/confirmar-comite`, {
      aprobar,
      observaciones: observaciones ?? null,
    });
  }

  adjuntarDocumento(id: number, file: File): Observable<Trabajo> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Trabajo>(`${this.baseUrl}/${id}/documento`, form);
  }

  baja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
