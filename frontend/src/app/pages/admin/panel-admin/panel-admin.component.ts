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

      <div class="admin-stats-grid">
        <div class="admin-stat admin-stat--usuarios">
          <span class="admin-stat-label">Usuarios</span>
          <span class="admin-stat-value">{{ stats?.totalUsuarios ?? '—' }}</span>
        </div>
        <div class="admin-stat admin-stat--adeuda">
          <span class="admin-stat-label">Adeudando pago</span>
          <span class="admin-stat-value">{{ stats?.inscripcionesPendientesPago ?? '—' }}</span>
        </div>
        <div class="admin-stat admin-stat--confirmados">
          <span class="admin-stat-label">Confirmados</span>
          <span class="admin-stat-value">{{ stats?.inscripcionesConfirmadas ?? '—' }}</span>
        </div>
        <div class="admin-stat admin-stat--trabajos">
          <span class="admin-stat-label">Trabajos</span>
          <span class="admin-stat-value">{{ stats?.trabajosPresentados ?? '—' }}</span>
        </div>
      </div>

      <div class="panel-asistente-grid admin-accion-grid">
        <a routerLink="/admin/congreso" class="accion-card accion-card--visual" data-card="congreso">
          <div class="accion-card-cover">
            <img class="accion-card-media" src="/admin-card-congreso.webp" alt="" />
            <h3>Congreso</h3>
          </div>
          <div class="accion-card-foot">
            <p>Datos, aulas, actividades, programa, certificados y fechas</p>
          </div>
        </a>
        <a routerLink="/admin/usuarios" class="accion-card accion-card--visual" data-card="usuarios">
          <div class="accion-card-cover">
            <img class="accion-card-media" src="/admin-card-usuarios.webp" alt="" />
            <h3>Usuarios</h3>
          </div>
          <div class="accion-card-foot">
            <p>Cuentas, roles y habilitación</p>
          </div>
        </a>
        <a routerLink="/admin/inscripciones" class="accion-card accion-card--visual" data-card="inscripciones">
          <div class="accion-card-cover">
            <img class="accion-card-media" src="/admin-card-inscripciones.webp" alt="" />
            <h3>Inscripciones</h3>
          </div>
          <div class="accion-card-foot">
            <p>Validar y aprobar inscripciones</p>
          </div>
        </a>
        <a routerLink="/admin/pagos" class="accion-card accion-card--visual" data-card="pagos">
          <div class="accion-card-cover">
            <img class="accion-card-media" src="/admin-card-pagos.webp" alt="" />
            <h3>Pagos pendientes</h3>
          </div>
          <div class="accion-card-foot">
            <p>Revisar transferencias y efectivo</p>
          </div>
        </a>
        <a routerLink="/admin/pagos/arqueo" class="accion-card accion-card--visual" data-card="arqueo">
          <div class="accion-card-cover">
            <img class="accion-card-media" src="/admin-card-arqueo.webp" alt="" />
            <h3>Arqueo de caja</h3>
          </div>
          <div class="accion-card-foot">
            <p>Efectivo aprobado vs dinero físico</p>
          </div>
        </a>
        <a routerLink="/admin/trabajos" class="accion-card accion-card--visual" data-card="trabajos">
          <div class="accion-card-cover">
            <img class="accion-card-media" src="/admin-card-trabajos.webp" alt="" />
            <h3>Trabajos</h3>
          </div>
          <div class="accion-card-foot">
            <p>Listado y seguimiento de trabajos</p>
          </div>
        </a>
        <a routerLink="/admin/circulares" class="accion-card accion-card--visual" data-card="circulares">
          <div class="accion-card-cover">
            <img class="accion-card-media" src="/admin-card-circulares.webp" alt="" />
            <h3>Circulares</h3>
          </div>
          <div class="accion-card-foot">
            <p>Publicar y editar circulares</p>
          </div>
        </a>
        <a routerLink="/admin/limpieza" class="accion-card accion-card--visual" data-card="limpieza">
          <div class="accion-card-cover">
            <img class="accion-card-media" src="/admin-card-limpieza.webp" alt="" />
            <h3>Limpieza de datos</h3>
          </div>
          <div class="accion-card-foot">
            <p>Eliminar trabajos, pagos y archivos</p>
          </div>
        </a>
        <a routerLink="/admin/emails" class="accion-card accion-card--visual" data-card="emails">
          <div class="accion-card-cover">
            <img class="accion-card-media" src="/admin-card-emails.webp" alt="" />
            <h3>Historial emails</h3>
          </div>
          <div class="accion-card-foot">
            <p>Registro de correos del sistema</p>
          </div>
        </a>
        <a routerLink="/admin/notificaciones" class="accion-card accion-card--visual" data-card="notificaciones">
          <div class="accion-card-cover">
            <img class="accion-card-media" src="/admin-card-notificaciones.webp" alt="" />
            <h3>Notificaciones in-app</h3>
          </div>
          <div class="accion-card-foot">
            <p>Listado y limpieza de avisos de la campanita</p>
          </div>
        </a>
        <a routerLink="/admin/estadisticas" class="accion-card accion-card--visual" data-card="estadisticas">
          <div class="accion-card-cover">
            <img class="accion-card-media" src="/admin-card-estadisticas.webp" alt="" />
            <h3>Estadísticas</h3>
          </div>
          <div class="accion-card-foot">
            <p>Checklist pre-congreso, reportes e interés por actividad</p>
          </div>
        </a>
        <a routerLink="/admin/notificaciones-broadcast" class="accion-card accion-card--visual" data-card="broadcast">
          <div class="accion-card-cover">
            <img class="accion-card-media" src="/admin-card-broadcast.webp" alt="" />
            <h3>Enviar notificación</h3>
          </div>
          <div class="accion-card-foot">
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
