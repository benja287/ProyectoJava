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

  obtenerPreCongreso(): Observable<PreCongresoReadiness> {
    return this.http.get<PreCongresoReadiness>(`${this.baseUrl}/pre-congreso`);
  }

  notificarOrganizacionPreCongreso(): Observable<AlertaEnvioResultado> {
    return this.http.post<AlertaEnvioResultado>(
      `${this.baseUrl}/pre-congreso/notificar-organizacion`,
      {}
    );
  }

  notificarPendientesPreCongreso(): Observable<AlertaEnvioResultado> {
    return this.http.post<AlertaEnvioResultado>(
      `${this.baseUrl}/pre-congreso/notificar-pendientes`,
      {}
    );
  }

  notificarTodoPreCongreso(): Observable<AlertaEnvioResultado> {
    return this.http.post<AlertaEnvioResultado>(`${this.baseUrl}/pre-congreso/notificar-todo`, {});
  }
}

export interface PreCongresoReadiness {
  listo: boolean;
  programaPublicado: boolean;
  trabajosPendientesPrecheck: number;
  trabajosPendientesAprobacionComite: number;
  trabajosEnEvaluacion: number;
  evaluacionesPendientes: number;
  invitacionesEvaluacionPendientes: number;
  inscripcionesPendientes: number;
  alertas: string[];
}

export interface AlertaEnvioResultado {
  notificacionesOrganizacion: number;
  recordatoriosUsuarios: number;
  mensaje: string;
}
