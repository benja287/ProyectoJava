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
      login.logout();
      router.navigate(['/login'], { queryParams: { sessionExpired: '1' } });
      return throwError(() => new Error('Sesión expirada'));
    }
  }

  let outgoing = req;
  const token = login.getToken();
  if (token && !isPublic) {
    outgoing = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(outgoing).pipe(
    catchError((err: HttpErrorResponse) => {
      if (!isPublic && (err.status === 401 || isCuentaDeshabilitada(err))) {
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
