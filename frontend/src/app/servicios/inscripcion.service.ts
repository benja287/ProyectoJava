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
  ReglasCategoria,
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
    form.append('categoria', request.categoria ?? '');
    form.append('institucion', request.institucion);
    form.append('provincia', request.provincia);
    form.append('requiereFactura', String(request.requiereFactura));
    form.append('metodoPago', request.metodoPago);
    form.append('monto', String(request.monto));
    form.append('tiposParticipacion', request.tiposParticipacion.join(','));
    if (request.participacionOtro) {
      form.append('participacionOtro', request.participacionOtro);
    }
    if (request.facturaRazonSocial) {
      form.append('facturaRazonSocial', request.facturaRazonSocial);
    }
    if (request.facturaCuit) {
      form.append('facturaCuit', request.facturaCuit);
    }
    if (request.facturaCondicionIva) {
      form.append('facturaCondicionIva', request.facturaCondicionIva);
    }
    if (request.facturaDomicilioFiscal) {
      form.append('facturaDomicilioFiscal', request.facturaDomicilioFiscal);
    }
    if (request.telefono) {
      form.append('telefono', request.telefono);
    }
    if (request.tipoIdentificacion) {
      form.append('tipoIdentificacion', request.tipoIdentificacion);
    }
    if (request.numeroIdentificacion) {
      form.append('numeroIdentificacion', request.numeroIdentificacion);
    }
    if (request.nacionalidad) {
      form.append('nacionalidad', request.nacionalidad);
    }
    if (request.certificado) {
      form.append('certificado', request.certificado);
    }
    if (request.comprobante) {
      form.append('comprobante', request.comprobante);
    }
    return this.http.post<InscripcionCongreso>(this.baseUrl, form);
  }

  reglasCategorias(): Observable<ReglasCategoria[]> {
    return this.http.get<ReglasCategoria[]>(`${this.baseUrl}/reglas-categorias`);
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

  /** GET /api/inscripciones/{id} */
  buscar(id: number): Observable<InscripcionCongreso> {
    return this.http.get<InscripcionCongreso>(`${this.baseUrl}/${id}`);
  }

  validar(id: number, request: ValidacionInscripcionRequest): Observable<InscripcionCongreso> {
    return this.http.put<InscripcionCongreso>(`${this.baseUrl}/${id}/validar`, request);
  }
}
