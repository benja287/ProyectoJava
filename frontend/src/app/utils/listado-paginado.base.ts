import { Directive, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Pagina } from '../models/pagina.model';
import {
  filtroFromParams,
  queryParamsFromFiltro,
} from './filtro-params.util';

/**
 * Base para listados admin con filtros en query params + paginación server-side.
 * Las páginas son 1-based (primera = 1), igual que el backend Jersey.
 *
 * Uso: la subclase define filterKeys, pageSize y cargarPagina();
 * en el template usa app-filter-bar + app-paginator.
 */
@Directive()
export abstract class ListadoPaginadoBase implements OnInit, OnDestroy {
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);

  abstract readonly filterKeys: readonly string[];

  /** Tamaño de página enviado al API. */
  pageSize = 20;

  page = 1;
  total = 0;
  totalPages = 0;
  filtros: Record<string, string> = {};
  cargando = true;
  error = '';

  private querySub?: Subscription;

  ngOnInit(): void {
    this.querySub = this.route.queryParamMap.subscribe((params) => {
      this.leerEstadoDesdeParams(params);
      this.cargarPagina();
    });
  }

  ngOnDestroy(): void {
    this.querySub?.unsubscribe();
  }

  /** Disparado por app-filter-bar: aplica filtros y vuelve a página 1. */
  onFiltrosAplicar(values: Record<string, string>): void {
    this.navegarListado(values, 1);
  }

  onFiltrosLimpiar(): void {
    this.navegarListado({}, 1);
  }

  /** Disparado por app-paginator. */
  onPageChange(page: number): void {
    this.navegarListado(this.filtros, page);
  }

  /** La subclase llama al servicio y responde con aplicarPagina(...). */
  protected abstract cargarPagina(): void;

  protected aplicarPagina<T>(pagina: Pagina<T>): void {
    this.page = pagina.page;
    this.total = pagina.total;
    this.totalPages = pagina.totalPages;
    this.cargando = false;
  }

  protected marcarError(mensaje: string): void {
    this.error = mensaje;
    this.cargando = false;
  }

  protected iniciarCarga(): void {
    this.cargando = true;
    this.error = '';
  }

  private leerEstadoDesdeParams(params: ParamMap): void {
    this.filtros = filtroFromParams(params, this.filterKeys);
    const pageRaw = params.get('page');
    const parsed = pageRaw ? Number(pageRaw) : 1;
    this.page = Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
  }

  private navegarListado(filtros: Record<string, string>, page: number): void {
    const queryParams: Record<string, string | null> = {
      ...queryParamsFromFiltro(filtros, this.filterKeys),
      page: page > 1 ? String(page) : null,
    };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: '',
    });
  }
}
