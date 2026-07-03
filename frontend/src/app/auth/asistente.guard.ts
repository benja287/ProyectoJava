/**
 * Guard para rutas del asistente al congreso (rol ASISTENTE, tras aprobación).
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
  if (login.necesitaInscripcionCongreso() || !login.tieneRolOperativo()) {
    return router.createUrlTree(['/inscripcion']);
  }
  return router.createUrlTree(['/']);
};
