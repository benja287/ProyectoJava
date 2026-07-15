import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminStats } from '../../../models/notificacion.model';
import {
  AdminStatsService,
  PreCongresoReadiness,
} from '../../../servicios/admin-stats.service';

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">⚙</span>
        <div>
          <h1>Panel de Administración</h1>
          <p>Gestión completa del congreso</p>
        </div>
      </div>

      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (preCongreso && !preCongreso.listo) {
        <div class="notice-box notice-box--amber">
          <strong>Pre-congreso:</strong> hay pendientes
          ({{ preCongreso.alertas.length }}).
          <a routerLink="/admin/estadisticas">Ver checklist y enviar avisos</a>
        </div>
      } @else if (preCongreso?.listo) {
        <div class="notice-box">
          <strong>Pre-congreso:</strong> checklist OK.
          <a routerLink="/admin/estadisticas">Ver detalle</a>
        </div>
      }

      <div class="stats-grid">
        <div class="stat-card stat-card--gris">
          <span class="stat-label">Usuarios</span>
          <span class="stat-value">{{ stats?.totalUsuarios ?? '—' }}</span>
        </div>
        <div class="stat-card stat-card--amarillo">
          <span class="stat-label">Inscriptos adeudando pago</span>
          <span class="stat-value">{{ stats?.inscripcionesPendientesPago ?? '—' }}</span>
        </div>
        <div class="stat-card stat-card--verde">
          <span class="stat-label">Inscriptos confirmados</span>
          <span class="stat-value">{{ stats?.inscripcionesConfirmadas ?? '—' }}</span>
        </div>
        <div class="stat-card stat-card--violeta">
          <span class="stat-label">Trabajos presentados</span>
          <span class="stat-value">{{ stats?.trabajosPresentados ?? '—' }}</span>
        </div>
      </div>

      <div class="panel-asistente-grid">
        <a routerLink="/admin/congreso" class="accion-card">
          <span class="accion-icono accion-icono--indigo" aria-hidden="true">📅</span>
          <div>
            <h3>Congreso</h3>
            <p>Datos, aulas, actividades, programa, certificados y fechas</p>
          </div>
        </a>
        <a routerLink="/admin/usuarios" class="accion-card">
          <span class="accion-icono accion-icono--azul" aria-hidden="true">👤</span>
          <div>
            <h3>Usuarios</h3>
            <p>Cuentas, roles y habilitación</p>
          </div>
        </a>
        <a routerLink="/admin/inscripciones" class="accion-card">
          <span class="accion-icono accion-icono--verde" aria-hidden="true">✓</span>
          <div>
            <h3>Inscripciones</h3>
            <p>Validar y aprobar inscripciones</p>
          </div>
        </a>
        <a routerLink="/admin/pagos" class="accion-card">
          <span class="accion-icono accion-icono--amarillo" aria-hidden="true">$</span>
          <div>
            <h3>Pagos pendientes</h3>
            <p>Revisar transferencias y efectivo</p>
          </div>
        </a>
        <a routerLink="/admin/trabajos" class="accion-card">
          <span class="accion-icono accion-icono--violeta" aria-hidden="true">📄</span>
          <div>
            <h3>Trabajos</h3>
            <p>Listado y seguimiento de trabajos</p>
          </div>
        </a>
        <a routerLink="/admin/circulares" class="accion-card">
          <span class="accion-icono accion-icono--teal" aria-hidden="true">📰</span>
          <div>
            <h3>Circulares</h3>
            <p>Publicar y editar circulares</p>
          </div>
        </a>
        <a routerLink="/admin/limpieza" class="accion-card">
          <span class="accion-icono accion-icono--naranja" aria-hidden="true">🧹</span>
          <div>
            <h3>Limpieza de datos</h3>
            <p>Eliminar trabajos, pagos y archivos</p>
          </div>
        </a>
        <a routerLink="/admin/emails" class="accion-card">
          <span class="accion-icono accion-icono--azul" aria-hidden="true">✉</span>
          <div>
            <h3>Historial emails</h3>
            <p>Registro de correos del sistema</p>
          </div>
        </a>
        <a routerLink="/admin/notificaciones" class="accion-card">
          <span class="accion-icono accion-icono--indigo" aria-hidden="true">🔔</span>
          <div>
            <h3>Notificaciones in-app</h3>
            <p>Listado y limpieza de avisos de la campanita</p>
          </div>
        </a>
        <a routerLink="/admin/estadisticas" class="accion-card">
          <span class="accion-icono accion-icono--violeta" aria-hidden="true">📊</span>
          <div>
            <h3>Estadísticas</h3>
            <p>Checklist pre-congreso, reportes e interés por actividad</p>
          </div>
        </a>
        <a routerLink="/admin/notificaciones-broadcast" class="accion-card">
          <span class="accion-icono accion-icono--indigo" aria-hidden="true">📢</span>
          <div>
            <h3>Enviar notificación</h3>
            <p>Avisar a usuarios o por rol</p>
          </div>
        </a>
      </div>
    </div>
  `,
})
export class PanelAdminComponent implements OnInit {
  private statsService = inject(AdminStatsService);

  stats?: AdminStats;
  preCongreso?: PreCongresoReadiness;
  mensaje = '';

  ngOnInit(): void {
    const st = history.state as { mensaje?: string } | null;
    if (st?.mensaje) {
      this.mensaje = st.mensaje;
      history.replaceState({}, '');
    }

    this.statsService.obtener().subscribe({
      next: (s) => (this.stats = s),
      error: () => (this.stats = undefined),
    });
    this.statsService.obtenerPreCongreso().subscribe({
      next: (r) => (this.preCongreso = r),
      error: () => (this.preCongreso = undefined),
    });
  }
}
