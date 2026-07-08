import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CongresoAnterior } from '../models/congreso-anterior.model';

@Injectable({ providedIn: 'root' })
export class CongresoAnteriorService {
  private readonly baseUrl = `${environment.apiUrl}/historia/congresos`;

  constructor(private http: HttpClient) {}

  listar(): Observable<CongresoAnterior[]> {
    return this.http.get<CongresoAnterior[]>(this.baseUrl);
  }
}
