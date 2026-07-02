/**
 * Guard para /seleccion-rol:
 * - Debe estar logueado
 * - Debe tener MÁS de un rol (si tiene uno solo → va directo a su panel)
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from './login.service';

export const seleccionRolGuard: CanActivateFn = () => {
  const login = inject(LoginService);
  const router = inject(Router);
  if (!login.isLogged()) {
    return router.createUrlTree(['/login']);
  }
  const roles = login.getUser()?.roles ?? [];
  if (roles.length <= 1) {
    return router.createUrlTree([login.homeRoute()]);
  }
  return true;
};
