import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FranjaHoraria, FranjaHorariaRequest } from '../models/franja-horaria.model';

@Injectable({ providedIn: 'root' })
export class FranjaHorariaService {
  private readonly baseUrl = `${environment.apiUrl}/franjas`;

  constructor(private http: HttpClient) {}

  listarActivas(dia?: number): Observable<FranjaHoraria[]> {
    let params = new HttpParams();
    if (dia != null) {
      params = params.set('dia', String(dia));
    }
    return this.http.get<FranjaHoraria[]>(this.baseUrl, { params });
  }

  listarAdmin(): Observable<FranjaHoraria[]> {
    return this.http.get<FranjaHoraria[]>(`${this.baseUrl}/admin`);
  }

  crear(body: FranjaHorariaRequest): Observable<FranjaHoraria> {
    return this.http.post<FranjaHoraria>(this.baseUrl, body);
  }

  modificar(id: number, body: FranjaHorariaRequest): Observable<FranjaHoraria> {
    return this.http.put<FranjaHoraria>(`${this.baseUrl}/${id}`, body);
  }

  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
