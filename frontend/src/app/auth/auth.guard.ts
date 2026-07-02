/**
 * Guard: solo deja pasar si hay usuario logueado (LoginService.isLogged()).
 * Si no → redirige a /login.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from './login.service';

export const authGuard: CanActivateFn = () => {
  const login = inject(LoginService);
  const router = inject(Router);
  if (login.isLogged()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
