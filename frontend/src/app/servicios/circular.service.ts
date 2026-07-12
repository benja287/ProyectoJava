import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Circular, PaginaCirculares } from '../models/circular.model';

export interface CircularRequest {
  titulo: string;
  resumen?: string;
  contenido: string;
  fechaPublicacion?: string;
  publicada?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CircularService {
  private readonly baseUrl = `${environment.apiUrl}/circulares`;

  constructor(private http: HttpClient) {}

  listarPublicadas(page = 1, size = 20): Observable<Circular[]> {
    return this.http
      .get<PaginaCirculares>(this.baseUrl, { params: { page, size } })
      .pipe(map((p) => p.items));
  }

  listarAdmin(page = 1, size = 50): Observable<Circular[]> {
    return this.listarAdminPagina(page, size).pipe(map((p) => p.items));
  }

  listarAdminPagina(page = 1, size = 20): Observable<PaginaCirculares> {
    return this.http.get<PaginaCirculares>(`${this.baseUrl}/admin`, {
      params: { page, size },
    });
  }

  obtener(id: number): Observable<Circular> {
    return this.http.get<Circular>(`${this.baseUrl}/${id}`);
  }

  crear(body: CircularRequest): Observable<Circular> {
    return this.http.post<Circular>(this.baseUrl, body);
  }

  modificar(id: number, body: CircularRequest): Observable<Circular> {
    return this.http.put<Circular>(`${this.baseUrl}/${id}`, body);
  }

  alternarPublicacion(id: number): Observable<Circular> {
    return this.http.put<Circular>(`${this.baseUrl}/${id}/publicar`, {});
  }

  adjuntarDocumento(id: number, file: File): Observable<Circular> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Circular>(`${this.baseUrl}/${id}/documento`, form);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
