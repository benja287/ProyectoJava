import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CongresoConfig } from '../models/congreso-config.model';

export type CongresoConfigUpdate = Partial<{
  programaPublicado: boolean;
  certificadosDisponiblesDesde: string | null;
  envioTrabajosHasta: string | null;
  congresoDesde: string | null;
  congresoHasta: string | null;
  inscripcionesDesde: string | null;
  inscripcionesHasta: string | null;
  evaluacionHasta: string | null;
}>;

@Injectable({ providedIn: 'root' })
export class CongresoConfigService {
  private readonly baseUrl = `${environment.apiUrl}/congreso/config`;

  constructor(private http: HttpClient) {}

  obtener(): Observable<CongresoConfig> {
    return this.http.get<CongresoConfig>(this.baseUrl);
  }

  actualizar(cambios: CongresoConfigUpdate): Observable<CongresoConfig> {
    return this.http.put<CongresoConfig>(this.baseUrl, cambios);
  }
}
