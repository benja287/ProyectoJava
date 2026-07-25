import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type TipoCertificadoApi =
  | 'ASISTENCIA'
  | 'EVALUADOR'
  | 'PRESENTACION'
  | 'PARTICIPACION_ACTIVIDADES';

export interface CertificadoItemApi {
  tipo: TipoCertificadoApi;
  titulo: string;
  detalle: string;
  lineas: string[];
}

export interface MisCertificadosApi {
  habilitados: boolean;
  disponiblesDesde: string | null;
  items: CertificadoItemApi[];
}

@Injectable({ providedIn: 'root' })
export class CertificadosService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/certificados`;

  mios(): Observable<MisCertificadosApi> {
    return this.http.get<MisCertificadosApi>(`${this.baseUrl}/mios`);
  }
}
