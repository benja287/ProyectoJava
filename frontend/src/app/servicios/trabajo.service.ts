import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PaginaTrabajos, Trabajo, TrabajoCreateRequest } from '../models/trabajo.model';

@Injectable({ providedIn: 'root' })
export class TrabajoService {
  private readonly baseUrl = `${environment.apiUrl}/trabajos`;

  constructor(private http: HttpClient) {}

  listar(page = 1, size = 50, autorId?: number): Observable<Trabajo[]> {
    let url = `${this.baseUrl}?page=${page}&size=${size}`;
    if (autorId != null) {
      url += `&autorId=${autorId}`;
    }
    return this.http.get<PaginaTrabajos>(url).pipe(map((p) => p.items));
  }

  buscar(id: number): Observable<Trabajo> {
    return this.http.get<Trabajo>(`${this.baseUrl}/${id}`);
  }

  crear(request: TrabajoCreateRequest): Observable<Trabajo> {
    return this.http.post<Trabajo>(this.baseUrl, request);
  }

  enviar(id: number): Observable<Trabajo> {
    return this.http.put<Trabajo>(`${this.baseUrl}/${id}/enviar`, {});
  }

  adjuntarDocumento(id: number, file: File): Observable<Trabajo> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Trabajo>(`${this.baseUrl}/${id}/documento`, form);
  }

  baja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
