/**
 * Guard para rutas del asistente al congreso (aprobado).
 * Acepta ASISTENTE y PARTICIPANTE legacy.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from './login.service';

export const asistenteGuard: CanActivateFn = () => {
  const login = inject(LoginService);
  const router = inject(Router);
  if (!login.isLogged()) {
    return router.createUrlTree(['/login']);
  }
  if (login.esAsistenteCongreso()) {
    return true;
  }
  if (!login.tieneRolOperativo()) {
    return router.createUrlTree(['/inscripcion']);
  }
  return router.createUrlTree(['/']);
};
