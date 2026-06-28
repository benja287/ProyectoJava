import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class RegistroService {
  private readonly baseUrl = `${environment.apiUrl}/registro`;

  constructor(private http: HttpClient) {}

  registrarParticipante(usuario: Usuario): Observable<Usuario> {
    const body = {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: usuario.password ?? '12345678',
    };
    return this.http.post<Usuario>(this.baseUrl, body);
  }
}
