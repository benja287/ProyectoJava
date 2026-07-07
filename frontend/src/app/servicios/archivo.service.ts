import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LimpiezaArchivoResult {
  eliminados: number;
  huerfanosRestantes: number;
  mensaje: string;
}

/** Host del API en dev cuando apiUrl es relativa (mismo target que proxy.conf.json). */
const DEV_API_ORIGIN = 'https://grupo1.jyaa-ci.linti.unlp.edu.ar';

@Injectable({ providedIn: 'root' })
export class ArchivoService {
  private readonly adminUrl = `${environment.apiUrl}/admin/archivos`;

  constructor(private http: HttpClient) {}

  resumenHuerfanos(): Observable<LimpiezaArchivoResult> {
    return this.http.get<LimpiezaArchivoResult>(`${this.adminUrl}/huerfanos/resumen`);
  }

  limpiarHuerfanos(): Observable<LimpiezaArchivoResult> {
    return this.http.delete<LimpiezaArchivoResult>(`${this.adminUrl}/huerfanos`);
  }

  /** Abre PDF/comprobante en pestaña nueva (evita que Angular dev server sirva index.html). */
  abrir(storedUrl: string | null | undefined): void {
    if (!storedUrl) {
      return;
    }
    const id = this.extractId(storedUrl);
    if (id == null) {
      window.open(this.resolveUrl(storedUrl), '_blank', 'noopener');
      return;
    }
    this.http
      .get(`${environment.apiUrl}/archivos/${id}`, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const type = blob.type && blob.type !== 'application/octet-stream'
            ? blob.type
            : 'application/pdf';
          const obj = URL.createObjectURL(new Blob([blob], { type }));
          window.open(obj, '_blank', 'noopener');
          setTimeout(() => URL.revokeObjectURL(obj), 120_000);
        },
        error: () => window.open(this.resolveUrl(storedUrl), '_blank', 'noopener'),
      });
  }

  resolveUrl(stored: string): string {
    if (stored.startsWith('http://') || stored.startsWith('https://')) {
      return stored;
    }
    const path = stored.startsWith('/') ? stored : `/${stored}`;
    const apiUrl = environment.apiUrl;
    if (apiUrl.startsWith('http')) {
      const base = apiUrl.replace(/\/api\/?$/, '');
      return `${base}${path}`;
    }
    if (!environment.production && typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return `${DEV_API_ORIGIN}${path}`;
      }
    }
    return path;
  }

  private extractId(stored: string): number | null {
    const match = stored.match(/\/archivos\/(\d+)/);
    return match ? Number(match[1]) : null;
  }
}
