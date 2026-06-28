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
