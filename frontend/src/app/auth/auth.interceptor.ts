/**
 * Interceptor HTTP: adjunta Authorization: Bearer y maneja expiración / 401.
 */
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginService } from './login.service';
import { isCuentaDeshabilitada } from '../utils/api-error.util';

function isPublicAuthRequest(url: string, method: string): boolean {
  /**
   * Estas requests NO deben llevar Bearer:
   * - POST /api/login
   * - POST /api/registro
   *
   * Si les adjuntamos token, podríamos mezclar una sesión vieja con un login nuevo.
   */
  if (method !== 'POST') {
    return false;
  }
  const base = environment.apiUrl.replace(/\/$/, '');
  const normalized = url.split('?')[0];
  return (
    normalized === `${base}/login` ||
    normalized.endsWith('/login') ||
    normalized === `${base}/registro` ||
    normalized.endsWith('/registro')
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const login = inject(LoginService);
  const router = inject(Router);
  const isPublic = isPublicAuthRequest(req.url, req.method);

  if (!isPublic) {
    const token = login.getToken();
    if (token && login.isTokenExpired()) {
      /**
       * Si el token ya expiró, no tiene sentido "probar" el request:
       * el backend responderá 401 igual. Mejor cortar acá, limpiar sesión y redirigir.
       */
      login.logout();
      router.navigate(['/login'], { queryParams: { sessionExpired: '1' } });
      return throwError(() => new Error('Sesión expirada'));
    }
  }

  let outgoing = req;
  const token = login.getToken();
  const conSesion = !!token;
  if (token && !isPublic) {
    /**
     * Acá se agrega el JWT al request.
     *
     * En el backend lo valida JwtAuthFilter y de ahí se construye AuthenticatedUser.
     */
    outgoing = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(outgoing).pipe(
    catchError((err: HttpErrorResponse) => {
      if (!isPublic && conSesion && (err.status === 401 || isCuentaDeshabilitada(err))) {
        /**
         * 401: token inválido/expirado/faltante (según mensaje del backend).
         * 403 con accountDisabled: el admin inhabilitó la cuenta.
         *
         * En ambos casos, se limpia sesión local para evitar loops de requests fallando.
         *
         * Sin sesión previa no se redirige: una página pública que consulta un endpoint
         * protegido no debe mandar al login (de eso se encarga authGuard en las rutas).
         */
        const accountDisabled = isCuentaDeshabilitada(err);
        login.logout();
        router.navigate(['/login'], {
          queryParams: accountDisabled
            ? { accountDisabled: '1' }
            : { sessionExpired: '1' },
        });
      }
      return throwError(() => err);
    })
  );
};
