import { HttpParams } from '@angular/common/http';
import { ParamMap } from '@angular/router';

/** Lee filtros activos desde query params de la URL. */
export function filtroFromParams(
  params: ParamMap,
  keys: readonly string[]
): Record<string, string> {
  const filtro: Record<string, string> = {};
  for (const key of keys) {
    const value = params.get(key);
    if (value != null && value.trim() !== '') {
      filtro[key] = value.trim();
    }
  }
  return filtro;
}

/** Convierte filtros a query params (null elimina la clave de la URL). */
export function queryParamsFromFiltro(
  filtro: Record<string, string | null | undefined>,
  keys: readonly string[]
): Record<string, string | null> {
  const queryParams: Record<string, string | null> = {};
  for (const key of keys) {
    const value = filtro[key];
    queryParams[key] =
      value != null && String(value).trim() !== '' ? String(value).trim() : null;
  }
  return queryParams;
}

/** Arma HttpParams con paginación y filtros opcionales para GET listados. */
export function buildListHttpParams(
  page: number,
  size: number,
  filtro: object,
  keys: readonly string[]
): HttpParams {
  const values = filtro as Record<string, string | number | null | undefined>;
  let params = new HttpParams().set('page', String(page)).set('size', String(size));
  for (const key of keys) {
    const value = values[key];
    if (value != null && String(value).trim() !== '') {
      params = params.set(key, String(value).trim());
    }
  }
  return params;
}
