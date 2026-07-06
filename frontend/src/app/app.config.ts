/**
 * Configuración global de la aplicación.
 * Se pasa a bootstrapApplication(AppComponent, appConfig).
 */
import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialogModule } from '@angular/material/dialog';

import { routes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';
import { LoginService } from './auth/login.service';
import { AppVersionService } from './servicios/app-version.service';

function initAuthSession(login: LoginService): () => void {
  return () => login.initSessionFromStorage();
}

function initVersionCheck(version: AppVersionService): () => Promise<void> {
  return () => version.ensureCurrentBuild();
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Detección de cambios: repinta la vista cuando cambian propiedades del componente
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Registra el Router con el mapa de rutas de app.routes.ts
    provideRouter(routes),
    // HttpClient + interceptor JWT (Authorization: Bearer)
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    importProvidersFrom(MatDialogModule),
    {
      provide: APP_INITIALIZER,
      useFactory: initVersionCheck,
      deps: [AppVersionService],
      multi: true,
    },
    // Valida JWT en sessionStorage antes de montar componentes (evita sesión fantasma)
    {
      provide: APP_INITIALIZER,
      useFactory: initAuthSession,
      deps: [LoginService],
      multi: true,
    },
  ],
};
