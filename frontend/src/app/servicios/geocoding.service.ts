import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SEDE_MAPA } from '../constants/sede-mapa';

export interface GeocodeResultado {
  lat: number;
  lng: number;
  /** Título corto (calle / cruce). */
  etiqueta: string;
  /** Ciudad / provincia (línea secundaria del desplegable). */
  detalle?: string;
}

export interface GeocodeOpciones {
  /** Sesgo geográfico (centro actual del mapa). */
  bias?: { lat: number; lng: number } | null;
  limit?: number;
}

interface NominatimHit {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
  class?: string;
  type?: string;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

type LatLng = { lat: number; lng: number };

/**
 * Geocoding: Nominatim para direcciones generales;
 * Overpass (geometría OSM) para cruces "60 y 119" con más precisión.
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly http = inject(HttpClient);
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search';
  private readonly overpassUrl = 'https://overpass-api.de/api/interpreter';

  /**
   * Sugerencias al tipear. Cruces tipo "60 y 118" → Overpass;
   * resto → Nominatim (Photon no indexa bien calles AR).
   */
  autocompletar(
    consulta: string,
    opciones: GeocodeOpciones = {}
  ): Observable<GeocodeResultado[]> {
    const q = consulta.trim();
    if (q.length < 2) {
      return of([]);
    }
    const cruce = this.parseCruce(q);
    // Cruce completo (ambos números): precisión Overpass.
    if (cruce && /\d{1,4}\s*(?:y|&|\/)\s*\d{1,4}/i.test(q)) {
      return this.buscar(q, { ...opciones, limit: opciones.limit ?? 4 });
    }
    return this.buscarNominatim(q, opciones.limit ?? 6, opciones.bias ?? null, q);
  }

  buscar(consulta: string, opciones: GeocodeOpciones = {}): Observable<GeocodeResultado[]> {
    const q = consulta.trim();
    if (q.length < 3) {
      return of([]);
    }
    const limit = opciones.limit ?? 5;
    const bias = opciones.bias ?? null;
    const cruce = this.parseCruce(q);

    if (cruce) {
      return this.buscarCruce(cruce.a, cruce.b, cruce.localidad, bias).pipe(
        switchMap((res) =>
          res.length
            ? of(res.slice(0, limit))
            : this.buscarNominatim(this.consultaCruceNominatim(cruce), limit, bias, q)
        ),
        catchError(() =>
          this.buscarNominatim(this.consultaCruceNominatim(cruce), limit, bias, q)
        )
      );
    }

    return this.buscarNominatim(q, limit, bias, q);
  }

  private buscarCruce(
    a: string,
    b: string,
    localidad: string,
    bias: LatLng | null
  ): Observable<GeocodeResultado[]> {
    const center = bias ?? SEDE_MAPA.defaultCenter;
    const radio = 14000;
    const ql = `
[out:json][timeout:45];
(
  way["name"~"^(Calle|Avenida|Diagonal|Boulevard) ${a}$"]["highway"](around:${radio},${center.lat},${center.lng});
)->.wa;
(
  way["name"~"^(Calle|Avenida|Diagonal|Boulevard) ${b}$"]["highway"](around:${radio},${center.lat},${center.lng});
)->.wb;
node(w.wa)(w.wb);
out;
way.wa;
out geom;
way.wb;
out geom;
`;

    return this.http
      .post<OverpassResponse>(this.overpassUrl, `data=${encodeURIComponent(ql)}`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      })
      .pipe(
        map((res) => this.resolverCruceDesdeOverpass(res, a, b, localidad, bias)),
        catchError(() => of([]))
      );
  }

  private resolverCruceDesdeOverpass(
    res: OverpassResponse,
    a: string,
    b: string,
    localidad: string,
    bias: LatLng | null
  ): GeocodeResultado[] {
    const elements = res.elements ?? [];
    const nodosCompartidos = elements.filter(
      (e) => e.type === 'node' && e.lat != null && e.lon != null
    );
    const waysA: LatLng[][] = [];
    const waysB: LatLng[][] = [];
    for (const e of elements) {
      if (e.type !== 'way' || !e.geometry?.length) {
        continue;
      }
      const name = e.tags?.['name'] ?? '';
      if (/bicisenda/i.test(name)) {
        continue;
      }
      const line = e.geometry.map((p) => ({ lat: p.lat, lng: p.lon }));
      if (new RegExp(`\\b${a}$`).test(name)) {
        waysA.push(line);
      }
      if (new RegExp(`\\b${b}$`).test(name)) {
        waysB.push(line);
      }
    }

    const out: GeocodeResultado[] = [];

    if (nodosCompartidos.length) {
      const puntos = nodosCompartidos
        .map((n) => ({ lat: n.lat!, lng: n.lon! }))
        .sort((p, q) => this.dist2(p, bias) - this.dist2(q, bias));
      const vistos = new Set<string>();
      for (const p of puntos) {
        const k = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
        if (vistos.has(k)) {
          continue;
        }
        vistos.add(k);
        out.push({
          ...p,
          etiqueta: `Cruce Calle ${a} y Calle ${b}`,
          detalle: localidad || 'La Plata, Buenos Aires',
        });
        if (out.length >= 3) {
          break;
        }
      }
      return out;
    }

    const cruces = this.interseccionesSegmentos(waysA, waysB);
    if (cruces.length) {
      cruces.sort((p, q) => this.dist2(p, bias) - this.dist2(q, bias));
      const vistos = new Set<string>();
      for (const p of cruces) {
        const k = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
        if (vistos.has(k)) {
          continue;
        }
        vistos.add(k);
        out.push({
          ...p,
          etiqueta: `Cruce Calle ${a} y Calle ${b}`,
          detalle: localidad || 'La Plata, Buenos Aires',
        });
        if (out.length >= 3) {
          break;
        }
      }
      return out;
    }

    const cerca = this.puntoMasCercanoEntreVias(waysA, waysB);
    if (cerca && cerca.metros < 120) {
      out.push({
        lat: cerca.punto.lat,
        lng: cerca.punto.lng,
        etiqueta: `Cruce aprox. Calle ${a} y Calle ${b}`,
        detalle: localidad || 'La Plata, Buenos Aires',
      });
      return out;
    }

    return [];
  }

  private interseccionesSegmentos(waysA: LatLng[][], waysB: LatLng[][]): LatLng[] {
    const hits: LatLng[] = [];
    for (const ga of waysA) {
      for (let i = 0; i < ga.length - 1; i++) {
        for (const gb of waysB) {
          for (let j = 0; j < gb.length - 1; j++) {
            const p = this.segmentoIntersecta(ga[i], ga[i + 1], gb[j], gb[j + 1]);
            if (p) {
              hits.push(p);
            }
          }
        }
      }
    }
    return hits;
  }

  private segmentoIntersecta(a: LatLng, b: LatLng, c: LatLng, d: LatLng): LatLng | null {
    const o1 = this.orient(a, b, c);
    const o2 = this.orient(a, b, d);
    const o3 = this.orient(c, d, a);
    const o4 = this.orient(c, d, b);
    if ((o1 > 0) === (o2 > 0) || (o3 > 0) === (o4 > 0)) {
      return null;
    }
    const den = (a.lat - b.lat) * (c.lng - d.lng) - (a.lng - b.lng) * (c.lat - d.lat);
    if (Math.abs(den) < 1e-18) {
      return null;
    }
    const lat =
      ((a.lat * b.lng - a.lng * b.lat) * (c.lat - d.lat) -
        (a.lat - b.lat) * (c.lat * d.lng - c.lng * d.lat)) /
      den;
    const lng =
      ((a.lat * b.lng - a.lng * b.lat) * (c.lng - d.lng) -
        (a.lng - b.lng) * (c.lat * d.lng - c.lng * d.lat)) /
      den;
    return { lat, lng };
  }

  private orient(a: LatLng, b: LatLng, c: LatLng): number {
    return (b.lng - a.lng) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lng - a.lng);
  }

  private puntoMasCercanoEntreVias(
    waysA: LatLng[][],
    waysB: LatLng[][]
  ): { punto: LatLng; metros: number } | null {
    let best: { punto: LatLng; metros: number } | null = null;
    for (const ga of waysA) {
      for (const pa of ga) {
        for (const gb of waysB) {
          for (const pb of gb) {
            const metros = Math.hypot(pa.lat - pb.lat, pa.lng - pb.lng) * 111_000;
            if (!best || metros < best.metros) {
              best = {
                metros,
                punto: { lat: (pa.lat + pb.lat) / 2, lng: (pa.lng + pb.lng) / 2 },
              };
            }
          }
        }
      }
    }
    return best;
  }

  private dist2(p: LatLng, bias: LatLng | null): number {
    if (!bias) {
      return 0;
    }
    return Math.hypot(p.lat - bias.lat, p.lng - bias.lng);
  }

  private parseCruce(q: string): { a: string; b: string; localidad: string } | null {
    const limpio = q.replace(/\s+/g, ' ').trim();
    const m =
      /(?:(?:calle|av(?:\.|enida)?|diag(?:\.|onal)?|b(?:lv|oulevard)?\.?)\s*)?(\d{1,4})\s*(?:y|&|\/|,)\s*(?:(?:calle|av(?:\.|enida)?|diag(?:\.|onal)?|b(?:lv|oulevard)?\.?)\s*)?(\d{1,4})\b/i.exec(
        limpio
      );
    if (!m) {
      return null;
    }
    const resto = limpio
      .replace(m[0], ' ')
      .replace(/^[,\s]+|[,\s]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return { a: m[1], b: m[2], localidad: resto };
  }

  private consultaCruceNominatim(cruce: {
    a: string;
    b: string;
    localidad: string;
  }): string {
    const loc = cruce.localidad || 'La Plata, Buenos Aires, Argentina';
    const conPais = /argentina/i.test(loc) ? loc : `${loc}, Argentina`;
    return `Calle ${cruce.a} & Calle ${cruce.b}, ${conPais}`;
  }

  private buscarNominatim(
    q: string,
    limit: number,
    bias: LatLng | null,
    consultaOriginal: string
  ): Observable<GeocodeResultado[]> {
    let params = new HttpParams()
      .set('q', q)
      .set('format', 'json')
      .set('limit', String(Math.max(limit, 8)))
      .set('addressdetails', '0')
      .set('countrycodes', 'ar')
      .set('dedupe', '1');

    if (bias) {
      const d = 0.12;
      params = params
        .set('viewbox', `${bias.lng - d},${bias.lat + d},${bias.lng + d},${bias.lat - d}`)
        .set('bounded', '0');
    }

    return this.http
      .get<NominatimHit[]>(this.nominatimUrl, {
        params,
        headers: { Accept: 'application/json' },
      })
      .pipe(
        map((hits) => this.ordenarNominatim(hits ?? [], consultaOriginal, bias).slice(0, limit)),
        catchError(() => of([]))
      );
  }

  private ordenarNominatim(
    hits: NominatimHit[],
    consultaOriginal: string,
    bias: LatLng | null
  ): GeocodeResultado[] {
    const nums = this.parseCruce(consultaOriginal);
    const scored = hits
      .map((h) => {
        const lat = Number(h.lat);
        const lng = Number(h.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }
        let score = (h.importance ?? 0) * 20;
        const tipo = `${h.class ?? ''}:${h.type ?? ''}`.toLowerCase();
        if (tipo.includes('intersection') || tipo.includes('crossing')) {
          score += 12;
        }
        if (nums && this.mencionaAmbos(h.display_name, nums.a, nums.b)) {
          score += 18;
        } else if (nums) {
          score -= 8;
        }
        if (bias) {
          score -= Math.hypot(lat - bias.lat, lng - bias.lng) * 40;
        }
        const partes = h.display_name.split(',').map((p) => p.trim());
        const etiqueta = partes[0] || h.display_name;
        const detalle = partes.slice(1, 4).join(', ') || undefined;
        return { lat, lng, etiqueta, detalle, score, key: `${lat.toFixed(4)},${lng.toFixed(4)}` };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);

    scored.sort((a, b) => b.score - a.score);
    const vistos = new Set<string>();
    const out: GeocodeResultado[] = [];
    for (const s of scored) {
      if (vistos.has(s.key)) {
        continue;
      }
      vistos.add(s.key);
      out.push({
        lat: s.lat,
        lng: s.lng,
        etiqueta: s.etiqueta,
        detalle: s.detalle,
      });
    }
    return out;
  }

  private mencionaAmbos(nombre: string, a: string, b: string): boolean {
    const n = nombre.toLowerCase();
    return n.includes(a) && n.includes(b);
  }
}
