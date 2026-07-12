/**
 * Metadata de listados paginados del API (Jersey).
 * Equivalente práctico a Spring Data Page&lt;T&gt;: items + page/size/total/totalPages.
 * Las páginas del API son 1-based (page=1 es la primera).
 */
export interface Pagina<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}
