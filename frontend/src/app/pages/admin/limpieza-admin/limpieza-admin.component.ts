import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Trabajo } from '../../../models/trabajo.model';
import { Pago } from '../../../models/pago.model';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { PagoService } from '../../../servicios/pago.service';
import { ArchivoService } from '../../../servicios/archivo.service';
import { AdminStatsService } from '../../../servicios/admin-stats.service';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-limpieza-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, ArchivoLinkComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">🧹</span>
        <div>
          <h1>Limpieza de datos</h1>
          <p>Eliminá trabajos, pagos o archivos de prueba</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin">← Volver al panel</a></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      <section class="panel-card panel-card--limpieza">
        <h2>Limpieza de datos</h2>
        <p class="muted">
          Eliminá trabajos o pagos de prueba. La baja es permanente (incluye archivos adjuntos cuando
          corresponda).
        </p>
        @if (limpiezaFeedback) {
          <p class="ok">{{ limpiezaFeedback }}</p>
        }

        <div class="limpieza-grid">
          <div class="limpieza-bloque">
            <div class="limpieza-bloque-header">
              <h3>Trabajos</h3>
              <a routerLink="/admin/trabajos" class="btn-link">Ver listado completo →</a>
            </div>
            @if (cargandoTrabajosLimpieza) {
              <p class="muted">Cargando trabajos...</p>
            } @else if (trabajosLimpieza.length === 0) {
              <p class="muted dashed-box">No hay trabajos registrados.</p>
            } @else {
              <div class="table-wrap">
                <table class="limpieza-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Título</th>
                      <th>Estado</th>
                      <th>PDF</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (t of trabajosLimpieza; track t.id) {
                      <tr>
                        <td>{{ t.id }}</td>
                        <td>{{ t.titulo }}</td>
                        <td>{{ t.estado }}</td>
                        <td>
                          @if (t.documentoUrl) {
                            <app-archivo-link [url]="t.documentoUrl" label="Ver" />
                          } @else {
                            —
                          }
                        </td>
                        <td>
                          <button type="button" class="btn-warn" (click)="eliminarTrabajo(t)">
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <p class="muted small">Mostrando los últimos {{ trabajosLimpieza.length }} trabajos.</p>
            }
          </div>

          <div class="limpieza-bloque">
            <div class="limpieza-bloque-header">
              <h3>Pagos</h3>
              <a routerLink="/admin/pagos/todos" class="btn-link">Ver listado completo →</a>
            </div>
            @if (cargandoPagosLimpieza) {
              <p class="muted">Cargando pagos...</p>
            } @else if (pagosLimpieza.length === 0) {
              <p class="muted dashed-box">No hay pagos registrados.</p>
            } @else {
              <div class="table-wrap">
                <table class="limpieza-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Comprobante</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of pagosLimpieza; track p.id) {
                      <tr>
                        <td>{{ p.id }}</td>
                        <td>{{ p.monto | number: '1.2-2' }}</td>
                        <td>{{ p.estado }}</td>
                        <td>
                          @if (p.comprobanteUrl) {
                            <app-archivo-link [url]="p.comprobanteUrl" label="Ver" />
                          } @else {
                            —
                          }
                        </td>
                        <td>
                          <button type="button" class="btn-warn" (click)="eliminarPago(p)">
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <p class="muted small">Mostrando los últimos {{ pagosLimpieza.length }} pagos.</p>
            }
          </div>

          <div class="limpieza-bloque">
            <div class="limpieza-bloque-header">
              <h3>Historial de emails</h3>
              <a routerLink="/admin/emails" class="btn-link">Ver historial completo →</a>
            </div>
            <p class="muted small">
              Correos enviados por precheck, evaluaciones, inscripciones y otras acciones del sistema.
              Podés liberar espacio en la base eliminando registros de prueba o fallidos.
              Las plantillas reutilizables no se borran con esa limpieza.
            </p>
            <a routerLink="/admin/emails" class="btn-secundario">Gestionar emails</a>
          </div>

          <div class="limpieza-bloque">
            <div class="limpieza-bloque-header">
              <h3>Archivos huérfanos</h3>
            </div>
            @if (cargandoArchivosHuerfanos) {
              <p class="muted">Detectando archivos sin referencia...</p>
            } @else {
              <p class="muted small">
                PDFs y comprobantes guardados en la base que ya no están vinculados a ningún trabajo,
                pago, inscripción ni circular (por ejemplo, tras reemplazar un documento).
              </p>
              <p class="limpieza-archivos-count">
                Detectados: <strong>{{ archivosHuerfanos }}</strong>
              </p>
              <button
                type="button"
                class="btn-warn"
                [disabled]="limpiandoArchivosHuerfanos || archivosHuerfanos === 0"
                (click)="limpiarArchivosHuerfanos()"
              >
                {{ limpiandoArchivosHuerfanos ? 'Limpiando...' : 'Eliminar archivos huérfanos' }}
              </button>
            }
          </div>
        </div>
      </section>
    </div>
  `,
})
export class LimpiezaAdminComponent implements OnInit {
  private trabajoService = inject(TrabajoService);
  private pagoService = inject(PagoService);
  private archivoService = inject(ArchivoService);
  private statsService = inject(AdminStatsService);

  trabajosLimpieza: Trabajo[] = [];
  pagosLimpieza: Pago[] = [];
  cargandoTrabajosLimpieza = true;
  cargandoPagosLimpieza = true;
  cargandoArchivosHuerfanos = true;
  limpiandoArchivosHuerfanos = false;
  archivosHuerfanos = 0;
  limpiezaFeedback = '';
  error = '';

  ngOnInit(): void {
    this.cargarLimpieza();
  }

  eliminarTrabajo(t: Trabajo): void {
    if (!t.id || !confirm(`¿Eliminar trabajo #${t.id} "${t.titulo}"?`)) {
      return;
    }
    this.limpiezaFeedback = '';
    this.error = '';
    this.trabajoService.baja(t.id).subscribe({
      next: () => {
        this.limpiezaFeedback = `Trabajo #${t.id} eliminado (incluye PDF si tenía).`;
        this.trabajosLimpieza = this.trabajosLimpieza.filter((x) => x.id !== t.id);
        this.statsService.obtener().subscribe();
        this.archivoService.resumenHuerfanos().subscribe({
          next: (r) => (this.archivosHuerfanos = r.huerfanosRestantes),
        });
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar el trabajo.');
      },
    });
  }

  eliminarPago(p: Pago): void {
    if (!p.id || !confirm(`¿Eliminar pago #${p.id}?`)) {
      return;
    }
    this.limpiezaFeedback = '';
    this.error = '';
    this.pagoService.baja(p.id).subscribe({
      next: () => {
        this.limpiezaFeedback = `Pago #${p.id} eliminado.`;
        this.pagosLimpieza = this.pagosLimpieza.filter((x) => x.id !== p.id);
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar el pago.');
      },
    });
  }

  limpiarArchivosHuerfanos(): void {
    if (
      this.archivosHuerfanos === 0 ||
      !confirm(`¿Eliminar ${this.archivosHuerfanos} archivo(s) huérfano(s) de la base?`)
    ) {
      return;
    }
    this.limpiezaFeedback = '';
    this.error = '';
    this.limpiandoArchivosHuerfanos = true;
    this.archivoService.limpiarHuerfanos().subscribe({
      next: (r) => {
        this.archivosHuerfanos = r.huerfanosRestantes;
        this.limpiezaFeedback = r.mensaje;
        this.limpiandoArchivosHuerfanos = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron eliminar los archivos huérfanos.');
        this.limpiandoArchivosHuerfanos = false;
      },
    });
  }

  private cargarLimpieza(): void {
    this.archivoService.resumenHuerfanos().subscribe({
      next: (r) => {
        this.archivosHuerfanos = r.huerfanosRestantes;
        this.cargandoArchivosHuerfanos = false;
      },
      error: () => {
        this.cargandoArchivosHuerfanos = false;
      },
    });
    this.trabajoService.listar(1, 20).subscribe({
      next: (items) => {
        this.trabajosLimpieza = items;
        this.cargandoTrabajosLimpieza = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar trabajos para limpieza.');
        this.cargandoTrabajosLimpieza = false;
      },
    });
    this.pagoService.listar(1, 20).subscribe({
      next: (items) => {
        this.pagosLimpieza = items;
        this.cargandoPagosLimpieza = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar pagos para limpieza.');
        this.cargandoPagosLimpieza = false;
      },
    });
  }
}
