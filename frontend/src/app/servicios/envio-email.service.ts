import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  EnvioEmail,
  EnvioEmailResumen,
  LimpiezaEnvioEmailResult,
  PaginaEnviosEmail,
} from '../models/envio-email.model';

export interface EnvioEmailFiltro {
  enviado?: boolean;
  destinatario?: string;
}

@Injectable({ providedIn: 'root' })
export class EnvioEmailService {
  private readonly baseUrl = `${environment.apiUrl}/admin/emails`;

  constructor(private http: HttpClient) {}

  listar(page = 1, size = 20, filtro: EnvioEmailFiltro = {}): Observable<PaginaEnviosEmail> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (filtro.enviado !== undefined && filtro.enviado !== null) {
      params = params.set('enviado', String(filtro.enviado));
    }
    if (filtro.destinatario?.trim()) {
      params = params.set('destinatario', filtro.destinatario.trim());
    }
    return this.http.get<PaginaEnviosEmail>(this.baseUrl, { params });
  }

  resumen(): Observable<EnvioEmailResumen> {
    return this.http.get<EnvioEmailResumen>(`${this.baseUrl}/resumen`);
  }

  obtener(id: number): Observable<EnvioEmail> {
    return this.http.get<EnvioEmail>(`${this.baseUrl}/${id}`);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  limpiar(alcance: 'fallidos' | 'antiguos' | 'todos', dias?: number): Observable<LimpiezaEnvioEmailResult> {
    let params = new HttpParams().set('alcance', alcance);
    if (dias != null && dias > 0) {
      params = params.set('dias', String(dias));
    }
    return this.http.delete<LimpiezaEnvioEmailResult>(this.baseUrl, { params });
  }
}
