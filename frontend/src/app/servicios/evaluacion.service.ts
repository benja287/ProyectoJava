import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  EvaluacionDictamenRequest,
  EvaluacionRegistrada,
} from '../models/evaluacion.model';

@Injectable({ providedIn: 'root' })
export class EvaluacionService {
  private readonly baseUrl = `${environment.apiUrl}/evaluaciones`;

  constructor(private http: HttpClient) {}

  /** Registro completo del dictamen (rúbrica + decisión). */
  registrarDictamen(request: EvaluacionDictamenRequest): Observable<EvaluacionRegistrada> {
    return this.http.post<EvaluacionRegistrada>(this.baseUrl, request);
  }

  /**
   * Compatibilidad: dictamen simple (sigue mapeando al endpoint nuevo).
   * @deprecated Preferir registrarDictamen / wizard.
   */
  registrar(asignacionId: number, recomendacion: string, comentario?: string): Observable<EvaluacionRegistrada> {
    return this.registrarDictamen({ asignacionId, recomendacion, comentario: comentario ?? null });
  }

  obtener(id: number): Observable<EvaluacionRegistrada> {
    return this.http.get<EvaluacionRegistrada>(`${this.baseUrl}/${id}`);
  }

  adjuntarArchivoCorreccion(evaluacionId: number, file: File): Observable<EvaluacionRegistrada> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<EvaluacionRegistrada>(
      `${this.baseUrl}/${evaluacionId}/archivo-correccion`,
      form
    );
  }
}
