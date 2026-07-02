/**
 * Punto de entrada de la aplicación Angular.
 * Se ejecuta cuando el navegador carga los scripts compilados.
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * bootstrapApplication:
 * 1. Crea el inyector con los providers de appConfig (Router, HttpClient, etc.)
 * 2. Resuelve dependencias de AppComponent (LoginService, Router...)
 * 3. Busca <app-root> en el DOM y monta AppComponent ahí
 */
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
