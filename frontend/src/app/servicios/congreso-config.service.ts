import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CongresoConfig, normalizarCongresoConfig } from '../models/congreso-config.model';

export type CongresoConfigGrupo =
  | 'CONGRESO'
  | 'INSCRIPCIONES'
  | 'ENVIO'
  | 'EVALUACION'
  | 'DATOS'
  | 'JORNADA'
  | 'CUPOS'
  | 'CATALOGOS';

export type CongresoConfigUpdate = Partial<{
  programaPublicado: boolean;
  certificadosDisponiblesDesde: string | null;
  envioTrabajosHasta: string | null;
  maxTrabajosAutor?: number | null;
  maxTrabajosAsistente?: number | null;
  congresoDesde: string | null;
  congresoHasta: string | null;
  inscripcionesDesde: string | null;
  inscripcionesHasta: string | null;
  evaluacionHasta: string | null;
  motivo: string | null;
  grupo: CongresoConfigGrupo | null;
  nombre: string | null;
  edicion: string | null;
  sede: string | null;
  mapaLatitud: number | null;
  mapaLongitud: number | null;
  jornadaInicio: string | null;
  jornadaFin: string | null;
  jornadaInicioDia1: string | null;
  jornadaFinDia1: string | null;
  jornadaInicioDia2: string | null;
  jornadaFinDia2: string | null;
  jornadaInicioDia3: string | null;
  jornadaFinDia3: string | null;
  ejesTematicos: import('../models/congreso-config.model').CatalogoItem[] | null;
  modalidadesPresentacion: import('../models/congreso-config.model').CatalogoItem[] | null;
  tiposEnvio: import('../models/congreso-config.model').CatalogoItem[] | null;
}>;

@Injectable({ providedIn: 'root' })
export class CongresoConfigService {
  private readonly baseUrl = `${environment.apiUrl}/congreso/config`;

  constructor(private http: HttpClient) {}

  obtener(): Observable<CongresoConfig> {
    return this.http
      .get<CongresoConfig>(this.baseUrl)
      .pipe(map((c) => normalizarCongresoConfig(c)));
  }

  actualizar(cambios: CongresoConfigUpdate): Observable<CongresoConfig> {
    return this.http
      .put<CongresoConfig>(this.baseUrl, cambios)
      .pipe(map((c) => normalizarCongresoConfig(c)));
  }

  /**
   * Finaliza el congreso para certificados: habilita descarga, registra emisiones y notifica.
   */
  finalizarCertificados(): Observable<FinalizarCertificadosResultado> {
    return this.http.post<FinalizarCertificadosResultado>(
      `${environment.apiUrl}/congreso/certificados/finalizar`,
      {}
    );
  }
}

export interface FinalizarCertificadosResultado {
  certificadosDisponiblesDesde: string | null;
  certificadosCreados: number;
  certificadosYaExistentes: number;
  notificacionesEnviadas: number;
}
