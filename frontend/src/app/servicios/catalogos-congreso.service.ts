import { Injectable, inject } from '@angular/core';
import { Observable, map, of, shareReplay, tap } from 'rxjs';
import {
  EJES_TEMATICOS,
  MODALIDAD_LABELS,
  MODALIDADES_PRESENTACION,
} from '../constants/ejes-tematicos';
import { TIPOS_TRABAJO } from '../models/enums';
import {
  CatalogoItem,
  CongresoConfig,
  catalogoActivos,
  etiquetaCatalogo,
} from '../models/congreso-config.model';
import { CongresoConfigService } from './congreso-config.service';

const FALLBACK_EJES: CatalogoItem[] = EJES_TEMATICOS.map((e, i) => ({
  codigo: e,
  etiqueta: e,
  activo: true,
  orden: i + 1,
  sistema: true,
}));

const FALLBACK_MODALIDADES: CatalogoItem[] = MODALIDADES_PRESENTACION.map((m, i) => ({
  codigo: m,
  etiqueta: MODALIDAD_LABELS[m],
  activo: true,
  orden: i + 1,
  sistema: true,
  grupoAgenda: m === 'ORAL' ? 'MESA' : 'POSTER',
}));

const FALLBACK_TIPOS: CatalogoItem[] = TIPOS_TRABAJO.map((t, i) => ({
  codigo: t,
  etiqueta:
    t === 'TRABAJO_CIENTIFICO'
      ? 'Trabajo científico'
      : t === 'RELATO_DE_EXPERIENCIA'
        ? 'Relato de experiencia'
        : 'Propuesta de taller',
  activo: true,
  orden: i + 1,
  sistema: true,
}));

@Injectable({ providedIn: 'root' })
export class CatalogosCongresoService {
  private configService = inject(CongresoConfigService);
  private cache$?: Observable<CongresoConfig>;

  /** Config con catálogos (cache en memoria hasta invalidate). */
  obtener(force = false): Observable<CongresoConfig> {
    if (!this.cache$ || force) {
      this.cache$ = this.configService.obtener().pipe(
        tap((cfg) => {
          if (!cfg.ejesTematicos?.length) {
            cfg.ejesTematicos = FALLBACK_EJES;
          }
          if (!cfg.modalidadesPresentacion?.length) {
            cfg.modalidadesPresentacion = FALLBACK_MODALIDADES;
          }
          if (!cfg.tiposEnvio?.length) {
            cfg.tiposEnvio = FALLBACK_TIPOS;
          }
        }),
        shareReplay(1)
      );
    }
    return this.cache$;
  }

  invalidate(): void {
    this.cache$ = undefined;
  }

  ejesActivos(): Observable<CatalogoItem[]> {
    return this.obtener().pipe(map((c) => catalogoActivos(c.ejesTematicos) || FALLBACK_EJES));
  }

  modalidadesActivas(): Observable<CatalogoItem[]> {
    return this.obtener().pipe(
      map((c) => catalogoActivos(c.modalidadesPresentacion) || FALLBACK_MODALIDADES)
    );
  }

  /** Tipos de envío de trabajos (sin propuesta de taller). */
  tiposEnvioPaperActivos(): Observable<CatalogoItem[]> {
    return this.obtener().pipe(
      map((c) => {
        const all = catalogoActivos(c.tiposEnvio) || FALLBACK_TIPOS;
        return all.filter((t) => t.codigo !== 'PROPUESTA_TALLER');
      })
    );
  }

  tiposEnvioTodosActivos(): Observable<CatalogoItem[]> {
    return this.obtener().pipe(map((c) => catalogoActivos(c.tiposEnvio) || FALLBACK_TIPOS));
  }

  etiquetaModalidad(codigo?: string | null): string {
    if (!codigo) return '—';
    return MODALIDAD_LABELS[codigo as keyof typeof MODALIDAD_LABELS] ?? codigo.replaceAll('_', ' ');
  }

  etiquetaTipo(codigo?: string | null): Observable<string> {
    if (!codigo) return of('—');
    return this.obtener().pipe(
      map((c) => etiquetaCatalogo(c.tiposEnvio, codigo) || this.fallbackTipo(codigo))
    );
  }

  private fallbackTipo(codigo: string): string {
    if (codigo === 'TRABAJO_CIENTIFICO') return 'Trabajo científico';
    if (codigo === 'RELATO_DE_EXPERIENCIA') return 'Relato de experiencia';
    if (codigo === 'PROPUESTA_TALLER') return 'Propuesta de taller';
    return codigo.replaceAll('_', ' ');
  }
}
