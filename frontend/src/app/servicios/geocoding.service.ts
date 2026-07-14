import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface GeocodeResultado {
  lat: number;
  lng: number;
  etiqueta: string;
}

/** Respuesta mínima de Nominatim (OpenStreetMap). */
interface NominatimHit {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Geocoding vía Nominatim (OSM). Solo para búsqueda de direcciones al editar la sede.
 * Uso puntual admin; respeta ~1 req/s con debounce en la UI.
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/search';

  buscar(consulta: string, limit = 5): Observable<GeocodeResultado[]> {
    const q = consulta.trim();
    if (q.length < 3) {
      return of([]);
    }
    const params = new HttpParams()
      .set('q', q)
      .set('format', 'json')
      .set('limit', String(limit))
      .set('addressdetails', '0')
      .set('countrycodes', 'ar');

    return this.http
      .get<NominatimHit[]>(this.baseUrl, {
        params,
        headers: { Accept: 'application/json' },
      })
      .pipe(
        map((hits) =>
          (hits ?? [])
            .map((h) => ({
              lat: Number(h.lat),
              lng: Number(h.lon),
              etiqueta: h.display_name,
            }))
            .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
        ),
        catchError(() => of([]))
      );
  }
}
