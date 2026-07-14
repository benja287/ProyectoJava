import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CongresoProgramaGuiaComponent } from './congreso-programa-guia.component';

/** Hub: crear actividades del programa (mesas, pósters, taller, conferencia). */
@Component({
  selector: 'app-congreso-actividades-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, CongresoProgramaGuiaComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">🎯</span>
        <div>
          <h1>Paso 4 · Crear actividades</h1>
          <p>
            Elegí el tipo; en cada formulario elegís aula y franja. Después mirá el resultado en
            Programa.
          </p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin/congreso">← Volver a Congreso</a></p>
      <app-congreso-programa-guia [pasoActual]="4" />

      <div class="panel-asistente-grid">
        <a routerLink="/admin/mesas-tematicas" class="accion-card">
          <span class="accion-icono accion-icono--azul" aria-hidden="true">📋</span>
          <div>
            <h3>Crear mesa temática</h3>
            <p>Presentaciones orales agrupadas por eje</p>
          </div>
        </a>
        <a routerLink="/admin/mesas-redondas" class="accion-card">
          <span class="accion-icono accion-icono--violeta" aria-hidden="true">💬</span>
          <div>
            <h3>Crear mesa redonda</h3>
            <p>Debate con panelistas invitados</p>
          </div>
        </a>
        <a routerLink="/admin/sesion-posters" class="accion-card">
          <span class="accion-icono accion-icono--naranja" aria-hidden="true">🖼</span>
          <div>
            <h3>Crear sesión de pósters</h3>
            <p>Bloque de pósters en el cronograma</p>
          </div>
        </a>
        <a routerLink="/admin/crear-taller" class="accion-card">
          <span class="accion-icono accion-icono--teal" aria-hidden="true">🛠</span>
          <div>
            <h3>Crear taller</h3>
            <p>Taller oficial del programa</p>
          </div>
        </a>
        <a routerLink="/admin/crear-conferencia" class="accion-card">
          <span class="accion-icono accion-icono--indigo" aria-hidden="true">🎤</span>
          <div>
            <h3>Crear conferencia</h3>
            <p>Conferencia magistral u otro bloque oratorio</p>
          </div>
        </a>
      </div>
    </div>
  `,
})
export class CongresoActividadesAdminComponent {}
