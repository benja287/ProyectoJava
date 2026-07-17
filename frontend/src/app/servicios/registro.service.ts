import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../models/usuario.model';

export interface RegistroParticipanteRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  categoria: string;
  telefono: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nacionalidad: string;
}

@Injectable({ providedIn: 'root' })
export class RegistroService {
  private readonly baseUrl = `${environment.apiUrl}/registro`;

  constructor(private http: HttpClient) {}

  registrarParticipante(datos: RegistroParticipanteRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.baseUrl, datos);
  }
}
