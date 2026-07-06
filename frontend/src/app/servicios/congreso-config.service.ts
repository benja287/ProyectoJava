import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CongresoConfig } from '../models/congreso-config.model';

@Injectable({ providedIn: 'root' })
export class CongresoConfigService {
  private readonly baseUrl = `${environment.apiUrl}/congreso/config`;

  constructor(private http: HttpClient) {}

  obtener(): Observable<CongresoConfig> {
    return this.http.get<CongresoConfig>(this.baseUrl);
  }

  actualizar(
    cambios: Partial<{
      programaPublicado: boolean;
      certificadosDisponiblesDesde: string | null;
      envioTrabajosHasta: string | null;
    }>
  ): Observable<CongresoConfig> {
    return this.http.put<CongresoConfig>(this.baseUrl, cambios);
  }
}
