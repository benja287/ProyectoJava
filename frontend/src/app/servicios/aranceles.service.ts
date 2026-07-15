import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ArancelesConfig, ArancelesConfigUpdate } from '../models/aranceles.model';

@Injectable({ providedIn: 'root' })
export class ArancelesService {
  private readonly baseUrl = `${environment.apiUrl}/congreso/aranceles`;

  constructor(private http: HttpClient) {}

  obtener(): Observable<ArancelesConfig> {
    return this.http.get<ArancelesConfig>(this.baseUrl);
  }

  guardar(body: ArancelesConfigUpdate): Observable<ArancelesConfig> {
    return this.http.put<ArancelesConfig>(this.baseUrl, body);
  }

  subirQr(archivo: File): Observable<ArancelesConfig> {
    const form = new FormData();
    form.append('archivo', archivo);
    return this.http.post<ArancelesConfig>(`${this.baseUrl}/qr`, form);
  }

  quitarQr(): Observable<ArancelesConfig> {
    return this.http.delete<ArancelesConfig>(`${this.baseUrl}/qr`);
  }
}
