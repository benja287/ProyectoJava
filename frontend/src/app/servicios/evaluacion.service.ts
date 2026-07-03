import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EvaluacionService {
  private readonly baseUrl = `${environment.apiUrl}/evaluaciones`;

  constructor(private http: HttpClient) {}

  registrar(asignacionId: number, recomendacion: string, comentario?: string): Observable<unknown> {
    return this.http.post(this.baseUrl, { asignacionId, recomendacion, comentario });
  }
}
