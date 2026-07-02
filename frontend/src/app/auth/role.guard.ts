/**
 * Guard de rol: factory que recibe los roles permitidos.
 * Ejemplo: roleGuard(['ADMINISTRADOR']) protege rutas /admin/*
 *
 * Orden de verificación:
 * 1. ¿Logueado? → si no, /login
 * 2. ¿Tiene alguno de los roles? → si sí, true
 * 3. Si no → redirige a inicio /
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from './login.service';

export function roleGuard(roles: string[]): CanActivateFn {
  return () => {
    const login = inject(LoginService);
    const router = inject(Router);
    if (!login.isLogged()) {
      return router.createUrlTree(['/login']);
    }
    if (login.hasAnyRole(roles)) {
      return true;
    }
    return router.createUrlTree(['/']);
  };
}
