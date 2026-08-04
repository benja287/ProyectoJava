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
    <div class="panel-page comite-hub">
      <div class="panel-hero panel-hero--admin comite-hub-hero">
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

      <section class="panel-card comite-hub-section">
        <h2>Gestión del comité</h2>
        <p class="muted comite-hub-lead">
          Accedé a prevalidación, evaluadores, cupos y catálogos del proceso científico.
        </p>
        <div class="panel-asistente-grid comite-accion-grid">
          <a
            routerLink="/organizador/comite"
            class="accion-card accion-card--visual"
            data-card="trabajos"
          >
            <div class="accion-card-cover">
              <img class="accion-card-media" src="/comite-card-trabajos.webp" alt="" />
              <h3>Trabajos y prevalidación</h3>
            </div>
            <div class="accion-card-foot">
              <p>Listado, detalle, precheck y asignación de evaluadores</p>
            </div>
          </a>
          <a
            routerLink="/organizador/evaluadores"
            class="accion-card accion-card--visual"
            data-card="evaluadores"
          >
            <div class="accion-card-cover">
              <img class="accion-card-media" src="/comite-card-evaluadores.webp" alt="" />
              <h3>Evaluadores por eje</h3>
            </div>
            <div class="accion-card-foot">
              <p>Asignar ejes, ver restantes y reiniciar cupos</p>
            </div>
          </a>
          <a
            routerLink="/organizador/solicitudes-evaluador"
            class="accion-card accion-card--visual"
            data-card="solicitudes"
          >
            <div class="accion-card-cover">
              <img class="accion-card-media" src="/comite-card-solicitudes.webp" alt="" />
              <h3>Solicitudes de evaluadores</h3>
            </div>
            <div class="accion-card-foot">
              <p>Al aprobar se asignan los ejes con capacidad &gt; 0</p>
            </div>
          </a>
          <a
            routerLink="/organizador/plazo-envio"
            class="accion-card accion-card--visual"
            data-card="limites"
          >
            <div class="accion-card-cover">
              <img class="accion-card-media" src="/comite-card-limites.webp" alt="" />
              <h3>Límites de envío</h3>
            </div>
            <div class="accion-card-foot">
              <p>Fecha límite y cupo global de trabajos</p>
            </div>
          </a>
          <a
            routerLink="/organizador/excepciones-cupo"
            class="accion-card accion-card--visual"
            data-card="excepciones"
          >
            <div class="accion-card-cover">
              <img class="accion-card-media" src="/comite-card-excepciones.webp" alt="" />
              <h3>Excepciones de cupo</h3>
            </div>
            <div class="accion-card-foot">
              <p>Aumentar el límite a usuarios concretos</p>
            </div>
          </a>
          <a
            routerLink="/organizador/catalogos-envio"
            class="accion-card accion-card--visual"
            data-card="catalogos"
          >
            <div class="accion-card-cover">
              <img class="accion-card-media" src="/comite-card-catalogos.webp" alt="" />
              <h3>Catálogos de envío</h3>
            </div>
            <div class="accion-card-foot">
              <p>Ejes temáticos, modalidades y tipos</p>
            </div>
          </a>
          <a
            routerLink="/organizador/estadisticas"
            class="accion-card accion-card--visual"
            data-card="estadisticas"
          >
            <div class="accion-card-cover">
              <img class="accion-card-media" src="/comite-card-estadisticas.webp" alt="" />
              <h3>Estadísticas</h3>
            </div>
            <div class="accion-card-foot">
              <p>Checklist pre-congreso y métricas del comité</p>
            </div>
          </a>
        </div>
      </section>

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
