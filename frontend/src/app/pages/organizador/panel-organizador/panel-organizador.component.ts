import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  AdminStatsService,
  PreCongresoReadiness,
} from '../../../servicios/admin-stats.service';

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

      @if (preCongreso && !preCongreso.listo) {
        <div class="notice-box notice-box--amber">
          <strong>Pre-congreso:</strong> hay pendientes
          ({{ preCongreso.alertas.length }}).
          <a routerLink="/organizador/estadisticas">Ver checklist y enviar avisos</a>
        </div>
      } @else if (preCongreso?.listo) {
        <div class="notice-box">
          <strong>Pre-congreso:</strong> checklist OK.
          <a routerLink="/organizador/estadisticas">Ver detalle</a>
        </div>
      }

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
            <p>Asignar ejes, ver restantes y reiniciar cupos</p>
          </div>
        </a>
        <a routerLink="/organizador/solicitudes-evaluador" class="accion-card">
          <span class="accion-icono accion-icono--naranja" aria-hidden="true">📋</span>
          <div>
            <h3>Solicitudes de evaluadores</h3>
            <p>Al aprobar se asignan todos los ejes con capacidad &gt; 0</p>
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
            <p>Checklist pre-congreso, trabajos por eje y evaluaciones pendientes</p>
          </div>
        </a>
      </div>

      <p class="panel-volver"><a routerLink="/">← Volver al inicio</a></p>
    </div>
  `,
})
export class PanelOrganizadorComponent implements OnInit {
  private statsService = inject(AdminStatsService);
  preCongreso?: PreCongresoReadiness;

  ngOnInit(): void {
    this.statsService.obtenerPreCongreso().subscribe({
      next: (r) => (this.preCongreso = r),
      error: () => (this.preCongreso = undefined),
    });
  }
}
