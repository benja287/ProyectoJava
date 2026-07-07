import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EnvioEmail, EnvioEmailResumen } from '../../../models/envio-email.model';
import { EnvioEmailService } from '../../../servicios/envio-email.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-emails-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">✉</span>
        <div>
          <h1>Historial de emails</h1>
          <p>Registro de correos enviados por el sistema (precheck, evaluaciones, inscripciones, etc.)</p>
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
          <span class="stat-label">Total registrados</span>
          <span class="stat-value">{{ resumen?.total ?? '—' }}</span>
        </div>
        <div class="stat-card stat-card--verde">
          <span class="stat-label">Enviados OK</span>
          <span class="stat-value">{{ resumen?.enviados ?? '—' }}</span>
        </div>
        <div class="stat-card stat-card--amarillo">
          <span class="stat-label">Fallidos</span>
          <span class="stat-value">{{ resumen?.fallidos ?? '—' }}</span>
        </div>
      </div>

      <section class="panel-card panel-card--limpieza">
        <h2>Limpieza del historial</h2>
        <p class="muted">
          Liberá espacio en la base de datos eliminando registros de prueba o envíos fallidos.
          Los correos ya enviados no se reenvían al borrar el historial.
        </p>
        <div class="emails-limpieza-actions">
          <button type="button" class="btn-warn" [disabled]="limpiando" (click)="limpiar('fallidos')">
            Eliminar solo fallidos
          </button>
          <button type="button" class="btn-warn" [disabled]="limpiando" (click)="limpiarAntiguos()">
            Eliminar más de {{ diasAntiguos }} días
          </button>
          <button type="button" class="btn-warn" [disabled]="limpiando" (click)="limpiar('todos')">
            Vaciar todo el historial
          </button>
        </div>
        <label class="inline-label">
          Días para limpieza de antiguos
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
              <option value="ok">Enviados</option>
              <option value="fail">Fallidos</option>
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
        } @else if (emails.length === 0) {
          <p class="muted dashed-box">No hay registros de email.</p>
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
                @for (e of emails; track e.id) {
                  <tr [class.emails-row--fail]="!e.enviado">
                    <td>{{ formatFecha(e.fechaEnvio) }}</td>
                    <td>{{ e.destinatario }}</td>
                    <td>
                      <button type="button" class="btn-link emails-asunto-btn" (click)="verDetalle(e)">
                        {{ e.asunto }}
                      </button>
                    </td>
                    <td>
                      @if (e.enviado) {
                        <span class="badge badge--ok">Enviado</span>
                      } @else {
                        <span class="badge badge--warn" [title]="e.error || ''">Fallido</span>
                      }
                    </td>
                    <td>
                      <button type="button" class="btn-warn" (click)="eliminarUno(e)">Eliminar</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="muted small">
            Página {{ pagina }} de {{ totalPaginas || 1 }} — {{ total }} registro(s)
          </p>
          <div class="emails-paginacion">
            <button type="button" class="btn-secundario" [disabled]="pagina <= 1" (click)="irPagina(pagina - 1)">
              Anterior
            </button>
            <button
              type="button"
              class="btn-secundario"
              [disabled]="pagina >= totalPaginas"
              (click)="irPagina(pagina + 1)"
            >
              Siguiente
            </button>
          </div>
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
              Para: {{ detalle.destinatario }} —
              {{ formatFecha(detalle.fechaEnvio) }} —
              {{ detalle.enviado ? 'Enviado' : 'Fallido' }}
              @if (detalle.error) {
                — {{ detalle.error }}
              }
            </p>
            <pre class="emails-cuerpo">{{ detalle.cuerpo }}</pre>
          </article>
        </div>
      }

      <p class="emails-back">
        <a routerLink="/admin">← Volver al panel admin</a>
      </p>
    </div>
  `,
})
export class EmailsAdminComponent implements OnInit {
  private readonly envioEmailService = inject(EnvioEmailService);

  emails: EnvioEmail[] = [];
  resumen: EnvioEmailResumen | null = null;
  detalle: EnvioEmail | null = null;
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
    const filtro: { enviado?: boolean; destinatario?: string } = {};
    if (this.filtroEstado === 'ok') filtro.enviado = true;
    if (this.filtroEstado === 'fail') filtro.enviado = false;
    if (this.filtroDestinatario.trim()) filtro.destinatario = this.filtroDestinatario.trim();

    this.envioEmailService.listar(this.pagina, 20, filtro).subscribe({
      next: (p) => {
        this.emails = p.items;
        this.total = p.total;
        this.totalPaginas = p.totalPages;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar el historial.');
        this.cargando = false;
      },
    });
  }

  cargarResumen(): void {
    this.envioEmailService.resumen().subscribe({
      next: (r) => (this.resumen = r),
      error: () => {},
    });
  }

  irPagina(n: number): void {
    this.pagina = n;
    this.cargar();
  }

  verDetalle(e: EnvioEmail): void {
    this.detalle = e;
  }

  cerrarDetalle(): void {
    this.detalle = null;
  }

  eliminarUno(e: EnvioEmail): void {
    if (!e.id || !confirm(`¿Eliminar el registro #${e.id}?`)) return;
    this.envioEmailService.eliminar(e.id).subscribe({
      next: () => {
        this.mensaje = 'Registro eliminado.';
        this.cargarResumen();
        this.cargar();
      },
      error: (err) => (this.error = mensajeErrorApi(err, 'No se pudo eliminar.')),
    });
  }

  limpiar(alcance: 'fallidos' | 'antiguos' | 'todos'): void {
    const textos: Record<string, string> = {
      fallidos: '¿Eliminar todos los envíos fallidos?',
      antiguos: `¿Eliminar envíos de más de ${this.diasAntiguos} días?`,
      todos: '¿Vaciar TODO el historial de emails? Esta acción no se puede deshacer.',
    };
    if (!confirm(textos[alcance])) return;
    this.limpiando = true;
    this.mensaje = '';
    this.error = '';
    const dias = alcance === 'antiguos' ? this.diasAntiguos : undefined;
    this.envioEmailService.limpiar(alcance, dias).subscribe({
      next: (r) => {
        this.mensaje = r.mensaje;
        this.limpiando = false;
        this.pagina = 1;
        this.cargarResumen();
        this.cargar();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo limpiar el historial.');
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
