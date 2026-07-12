import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Aula, AulaRequest } from '../models/aula.model';

@Injectable({ providedIn: 'root' })
export class AulaService {
  private readonly baseUrl = `${environment.apiUrl}/aulas`;

  constructor(private http: HttpClient) {}

  listarActivas(): Observable<Aula[]> {
    return this.http.get<Aula[]>(this.baseUrl);
  }

  listarAdmin(): Observable<Aula[]> {
    return this.http.get<Aula[]>(`${this.baseUrl}/admin`);
  }

  crear(body: AulaRequest): Observable<Aula> {
    return this.http.post<Aula>(this.baseUrl, body);
  }

  modificar(id: number, body: AulaRequest): Observable<Aula> {
    return this.http.put<Aula>(`${this.baseUrl}/${id}`, body);
  }

  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
