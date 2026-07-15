import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppPaginatorComponent } from '../../../components/paginator/app-paginator.component';
import {
  NotificacionAdmin,
  NotificacionResumen,
} from '../../../models/notificacion.model';
import { NotificacionService } from '../../../servicios/notificacion.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-notificaciones-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppPaginatorComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">🔔</span>
        <div>
          <h1>Notificaciones in-app</h1>
          <p>Avisos de la campanita guardados en la base (todos los usuarios)</p>
        </div>
      </div>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <div class="stats-grid emails-stats">
        <div class="stat-card stat-card--gris">
          <span class="stat-label">Total</span>
          <span class="stat-value">{{ resumen?.total ?? '—' }}</span>
        </div>
        <div class="stat-card stat-card--verde">
          <span class="stat-label">Leídas</span>
          <span class="stat-value">{{ resumen?.leidas ?? '—' }}</span>
        </div>
        <div class="stat-card stat-card--amarillo">
          <span class="stat-label">No leídas</span>
          <span class="stat-value">{{ resumen?.noLeidas ?? '—' }}</span>
        </div>
      </div>

      <section class="panel-card panel-card--limpieza">
        <h2>Limpieza</h2>
        <p class="muted">
          Liberá espacio eliminando notificaciones de prueba, leídas o antiguas. No afecta el historial
          de emails ni las plantillas.
        </p>
        <div class="emails-limpieza-actions">
          <button type="button" class="btn-warn" [disabled]="limpiando" (click)="limpiar('leidas')">
            Eliminar leídas
          </button>
          <button type="button" class="btn-warn" [disabled]="limpiando" (click)="limpiarAntiguos()">
            Eliminar más de {{ diasAntiguos }} días
          </button>
          <button type="button" class="btn-warn" [disabled]="limpiando" (click)="limpiar('todos')">
            Vaciar todas
          </button>
        </div>
        <label class="inline-label">
          Días para limpieza de antiguas
          <input type="number" min="1" max="365" [(ngModel)]="diasAntiguos" />
        </label>
      </section>

      <section class="panel-card">
        <h2>Registros</h2>
        <div class="emails-filtros">
          <label>
            Estado
            <select [(ngModel)]="filtroEstado" (ngModelChange)="cargar()">
              <option value="">Todos</option>
              <option value="leida">Leídas</option>
              <option value="noleida">No leídas</option>
            </select>
          </label>
          <label>
            Destinatario
            <input
              type="search"
              [(ngModel)]="filtroDestinatario"
              placeholder="email@..."
              (keyup.enter)="cargar()"
            />
          </label>
          <button type="button" class="btn-primary" (click)="cargar()">Buscar</button>
        </div>

        @if (cargando) {
          <p class="muted">Cargando...</p>
        } @else if (items.length === 0) {
          <p class="muted dashed-box">No hay notificaciones en la base.</p>
        } @else {
          <div class="table-wrap">
            <table class="limpieza-table emails-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Destinatario</th>
                  <th>Asunto</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (n of items; track n.id) {
                  <tr [class.emails-row--fail]="!n.leida">
                    <td>{{ formatFecha(n.fechaCreacion) }}</td>
                    <td>
                      <div>{{ n.usuarioEmail || '—' }}</div>
                      @if (n.usuarioNombre) {
                        <div class="muted small">{{ n.usuarioNombre }}</div>
                      }
                    </td>
                    <td>
                      <button type="button" class="btn-link emails-asunto-btn" (click)="verDetalle(n)">
                        {{ n.asunto }}
                      </button>
                    </td>
                    <td>
                      @if (n.leida) {
                        <span class="badge badge--ok">Leída</span>
                      } @else {
                        <span class="badge badge--warn">No leída</span>
                      }
                    </td>
                    <td>
                      <button type="button" class="btn-warn" (click)="eliminarUno(n)">Eliminar</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-paginator
            [currentPage]="pagina"
            [totalPages]="totalPaginas"
            [total]="total"
            [disabled]="cargando"
            (pageChange)="irPagina($event)"
          />
        }
      </section>

      @if (detalle) {
        <div class="emails-modal-backdrop" (click)="cerrarDetalle()">
          <article class="emails-modal" (click)="$event.stopPropagation()">
            <header class="emails-modal-header">
              <h3>{{ detalle.asunto }}</h3>
              <button type="button" class="btn-link" (click)="cerrarDetalle()">Cerrar</button>
            </header>
            <p class="muted small">
              Para: {{ detalle.usuarioEmail }} ({{ detalle.usuarioNombre || '—' }}) —
              {{ formatFecha(detalle.fechaCreacion) }} —
              {{ detalle.leida ? 'Leída' : 'No leída' }}
              @if (detalle.enlace) {
                — enlace: {{ detalle.enlace }}
              }
            </p>
            <pre class="emails-cuerpo">{{ detalle.mensaje }}</pre>
          </article>
        </div>
      }

      <p class="emails-back">
        <a routerLink="/admin/limpieza">← Volver a limpieza</a>
        ·
        <a routerLink="/admin">Panel admin</a>
      </p>
    </div>
  `,
})
export class NotificacionesAdminComponent implements OnInit {
  private readonly notificacionService = inject(NotificacionService);

  items: NotificacionAdmin[] = [];
  resumen: NotificacionResumen | null = null;
  detalle: NotificacionAdmin | null = null;
  cargando = false;
  limpiando = false;
  error = '';
  mensaje = '';
  pagina = 1;
  total = 0;
  totalPaginas = 0;
  filtroEstado = '';
  filtroDestinatario = '';
  diasAntiguos = 30;

  ngOnInit(): void {
    this.cargarResumen();
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    const filtro: { leida?: boolean; destinatario?: string } = {};
    if (this.filtroEstado === 'leida') filtro.leida = true;
    if (this.filtroEstado === 'noleida') filtro.leida = false;
    if (this.filtroDestinatario.trim()) filtro.destinatario = this.filtroDestinatario.trim();

    this.notificacionService.listarAdmin(this.pagina, 20, filtro).subscribe({
      next: (p) => {
        this.items = p.items;
        this.total = p.total;
        this.totalPaginas = p.totalPages;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar las notificaciones.');
        this.cargando = false;
      },
    });
  }

  cargarResumen(): void {
    this.notificacionService.resumenAdmin().subscribe({
      next: (r) => (this.resumen = r),
      error: () => {},
    });
  }

  irPagina(n: number): void {
    this.pagina = n;
    this.cargar();
  }

  verDetalle(n: NotificacionAdmin): void {
    this.detalle = n;
  }

  cerrarDetalle(): void {
    this.detalle = null;
  }

  eliminarUno(n: NotificacionAdmin): void {
    if (!n.id || !confirm(`¿Eliminar la notificación #${n.id}?`)) return;
    this.notificacionService.eliminarAdmin(n.id).subscribe({
      next: () => {
        this.mensaje = 'Notificación eliminada.';
        this.cargarResumen();
        this.cargar();
      },
      error: (err) => (this.error = mensajeErrorApi(err, 'No se pudo eliminar.')),
    });
  }

  limpiar(alcance: 'leidas' | 'antiguos' | 'todos'): void {
    const textos: Record<string, string> = {
      leidas: '¿Eliminar todas las notificaciones leídas?',
      antiguos: `¿Eliminar notificaciones de más de ${this.diasAntiguos} días?`,
      todos: '¿Vaciar TODAS las notificaciones in-app? Esta acción no se puede deshacer.',
    };
    if (!confirm(textos[alcance])) return;
    this.limpiando = true;
    this.mensaje = '';
    this.error = '';
    const dias = alcance === 'antiguos' ? this.diasAntiguos : undefined;
    this.notificacionService.limpiarAdmin(alcance, dias).subscribe({
      next: (r) => {
        this.mensaje = r.mensaje;
        this.limpiando = false;
        this.pagina = 1;
        this.cargarResumen();
        this.cargar();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo limpiar las notificaciones.');
        this.limpiando = false;
      },
    });
  }

  limpiarAntiguos(): void {
    this.limpiar('antiguos');
  }

  formatFecha(raw?: string): string {
    if (!raw) return '—';
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? raw : d.toLocaleString('es-AR');
  }
}
