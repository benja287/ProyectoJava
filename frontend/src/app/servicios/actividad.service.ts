import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Actividad, ActividadCronograma, ActualizarActividadProgramaRequest, CrearConferenciaRequest, CrearMesaRedondaRequest, CrearTallerOficialRequest, PaginaActividades } from '../models/actividad.model';
import { CrearMesaTematicaRequest, CrearSesionPostersRequest } from '../models/trabajo.model';
import { buildListHttpParams } from '../utils/filtro-params.util';

export interface ActividadListFiltro {
  codigo?: string;
  tipoActividad?: string;
  titulo?: string;
  sala?: string;
}

const ACTIVIDAD_FILTER_KEYS = ['codigo', 'tipoActividad', 'titulo', 'sala'] as const;

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly baseUrl = `${environment.apiUrl}/actividades`;

  constructor(private http: HttpClient) {}

  listar(page = 1, size = 50, filtro: ActividadListFiltro = {}): Observable<Actividad[]> {
    const params = buildListHttpParams(page, size, filtro, ACTIVIDAD_FILTER_KEYS);
    return this.http.get<PaginaActividades>(this.baseUrl, { params }).pipe(map((p) => p.items));
  }

  buscar(id: number): Observable<Actividad> {
    return this.http.get<Actividad>(`${this.baseUrl}/${id}`);
  }

  alta(actividad: Actividad): Observable<Actividad> {
    return this.http.post<Actividad>(this.baseUrl, actividad);
  }

  modificar(id: number, actividad: Actividad): Observable<Actividad> {
    return this.http.put<Actividad>(`${this.baseUrl}/${id}`, actividad);
  }

  baja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  crearMesaTematica(request: CrearMesaTematicaRequest): Observable<Actividad> {
    return this.http.post<Actividad>(`${this.baseUrl}/mesa-tematica`, request);
  }

  crearSesionPosters(request: CrearSesionPostersRequest): Observable<Actividad> {
    return this.http.post<Actividad>(`${this.baseUrl}/sesion-posters`, request);
  }

  crearMesaRedonda(request: CrearMesaRedondaRequest): Observable<Actividad> {
    return this.http.post<Actividad>(`${this.baseUrl}/mesa-redonda`, request);
  }

  crearTallerOficial(request: CrearTallerOficialRequest): Observable<Actividad> {
    return this.http.post<Actividad>(`${this.baseUrl}/taller-oficial`, request);
  }

  crearConferencia(request: CrearConferenciaRequest): Observable<Actividad> {
    return this.http.post<Actividad>(`${this.baseUrl}/conferencia`, request);
  }

  listarCronograma(): Observable<ActividadCronograma[]> {
    return this.http.get<ActividadCronograma[]>(`${this.baseUrl}/cronograma`);
  }

  actualizarPrograma(id: number, body: ActualizarActividadProgramaRequest): Observable<ActividadCronograma> {
    return this.http.put<ActividadCronograma>(`${this.baseUrl}/${id}/programa`, body);
  }

  quitarTrabajo(actividadId: number, trabajoId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${actividadId}/trabajos/${trabajoId}`);
  }
}
