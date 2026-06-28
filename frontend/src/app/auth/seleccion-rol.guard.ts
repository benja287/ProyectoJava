import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from './login.service';

/** Solo accede quien está logueado y tiene más de un rol. */
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
