import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  EstadoInscripcionParticipante,
  InscripcionCongreso,
  InscripcionCreateRequest,
  InscripcionListFiltro,
  PaginaInscripciones,
  ValidacionInscripcionRequest,
} from '../models/inscripcion.model';
import { buildListHttpParams } from '../utils/filtro-params.util';

const INSCRIPCION_FILTER_KEYS = ['estado', 'categoria'] as const;

@Injectable({ providedIn: 'root' })
export class InscripcionService {
  private readonly baseUrl = `${environment.apiUrl}/inscripciones`;

  constructor(private http: HttpClient) {}

  crear(request: InscripcionCreateRequest): Observable<InscripcionCongreso> {
    const form = new FormData();
    if (request.categoria) {
      form.append('categoria', request.categoria);
    }
    form.append('institucion', request.institucion);
    form.append('provincia', request.provincia);
    form.append('requiereFactura', String(request.requiereFactura));
    form.append('metodoPago', request.metodoPago);
    form.append('monto', String(request.monto));
    if (request.certificado) {
      form.append('certificado', request.certificado);
    }
    if (request.comprobante) {
      form.append('comprobante', request.comprobante);
    }
    return this.http.post<InscripcionCongreso>(this.baseUrl, form);
  }

  misEstado(): Observable<EstadoInscripcionParticipante> {
    return this.http.get<EstadoInscripcionParticipante>(`${this.baseUrl}/mis-datos`);
  }

  listar(page = 1, size = 50, filtro: InscripcionListFiltro = {}): Observable<InscripcionCongreso[]> {
    return this.listarPagina(page, size, filtro).pipe(map((p) => p.items));
  }

  listarPagina(
    page = 1,
    size = 20,
    filtro: InscripcionListFiltro = {}
  ): Observable<PaginaInscripciones> {
    const params = buildListHttpParams(page, size, filtro, INSCRIPCION_FILTER_KEYS);
    return this.http.get<PaginaInscripciones>(this.baseUrl, { params });
  }

  validar(id: number, request: ValidacionInscripcionRequest): Observable<InscripcionCongreso> {
    return this.http.put<InscripcionCongreso>(`${this.baseUrl}/${id}/validar`, request);
  }
}
