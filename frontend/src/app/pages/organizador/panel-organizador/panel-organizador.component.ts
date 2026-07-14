import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-panel-organizador',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--indigo">
        <span class="panel-hero-icon" aria-hidden="true">🎓</span>
        <div>
          <h1>Comité Académico</h1>
          <p>Prevalidación formal y asignación de trabajos a evaluadores por eje temático</p>
        </div>
      </div>

      <p class="comite-pasos">
        Pasos: 1) Seleccioná un trabajo → 2) precheck → 3) asigná 2 evaluadores → 4) empate 3er
        evaluador ·
        <a routerLink="/organizador/estadisticas">Ver estadísticas</a>
      </p>

      <div class="panel-asistente-grid">
        <a routerLink="/organizador/comite" class="accion-card">
          <span class="accion-icono accion-icono--violeta" aria-hidden="true">📄</span>
          <div>
            <h3>Trabajos y prevalidación</h3>
            <p>Listado, detalle, precheck y asignación de evaluadores</p>
          </div>
        </a>
        <a routerLink="/organizador/evaluadores" class="accion-card">
          <span class="accion-icono accion-icono--azul" aria-hidden="true">👤</span>
          <div>
            <h3>Evaluadores por eje temático</h3>
            <p>Asignar y quitar evaluadores en cada eje</p>
          </div>
        </a>
        <a routerLink="/organizador/plazo-envio" class="accion-card">
          <span class="accion-icono accion-icono--indigo" aria-hidden="true">📅</span>
          <div>
            <h3>Límite para envíos nuevos</h3>
            <p>Fecha límite para envíos nuevos de trabajos</p>
          </div>
        </a>
        <a routerLink="/organizador/estadisticas" class="accion-card">
          <span class="accion-icono accion-icono--verde" aria-hidden="true">📊</span>
          <div>
            <h3>Estadísticas</h3>
            <p>Trabajos por eje/estado, evaluaciones pendientes e interés por actividad</p>
          </div>
        </a>
      </div>

      <p class="panel-volver"><a routerLink="/">← Volver al inicio</a></p>
    </div>
  `,
})
export class PanelOrganizadorComponent {}
