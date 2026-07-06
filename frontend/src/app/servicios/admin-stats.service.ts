import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdminReport, AdminStats } from '../models/notificacion.model';
import { SolicitudAutor } from '../models/solicitud-autor.model';

@Injectable({ providedIn: 'root' })
export class AdminStatsService {
  private readonly baseUrl = `${environment.apiUrl}/admin/stats`;

  constructor(private http: HttpClient) {}

  obtener(): Observable<AdminStats> {
    return this.http.get<AdminStats>(this.baseUrl);
  }

  obtenerReporte(): Observable<AdminReport> {
    return this.http.get<AdminReport>(`${this.baseUrl}/reporte`);
  }

  solicitudesAutor(): Observable<SolicitudAutor[]> {
    return this.http.get<SolicitudAutor[]>(`${this.baseUrl}/solicitudes-autor`);
  }
}
