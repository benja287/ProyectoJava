import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
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
    form.append('categoria', request.categoria);
    form.append('institucion', request.institucion);
    form.append('provincia', request.provincia);
    form.append('requiereFactura', String(request.requiereFactura));
    if (request.certificado) {
      form.append('certificado', request.certificado);
    }
    return this.http.post<InscripcionCongreso>(this.baseUrl, form);
  }

  misDatos(): Observable<InscripcionCongreso> {
    return this.http.get<InscripcionCongreso>(`${this.baseUrl}/mis-datos`);
  }

  listar(page = 1, size = 50, filtro: InscripcionListFiltro = {}): Observable<InscripcionCongreso[]> {
    const params = buildListHttpParams(page, size, filtro, INSCRIPCION_FILTER_KEYS);
    return this.http
      .get<PaginaInscripciones>(this.baseUrl, { params })
      .pipe(map((p) => p.items));
  }

  validar(id: number, request: ValidacionInscripcionRequest): Observable<InscripcionCongreso> {
    return this.http.put<InscripcionCongreso>(`${this.baseUrl}/${id}/validar`, request);
  }
}
