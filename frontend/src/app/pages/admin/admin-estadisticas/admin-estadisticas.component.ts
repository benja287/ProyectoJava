import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AdminReport } from '../../../models/notificacion.model';
import {
  AdminStatsService,
  AlertaEnvioResultado,
  PreCongresoReadiness,
} from '../../../servicios/admin-stats.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-admin-estadisticas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero" [class.panel-hero--admin]="!esComite" [class.panel-hero--indigo]="esComite">
        <span class="panel-hero-icon" aria-hidden="true">📊</span>
        <div>
          <h1>Estadísticas y reportes</h1>
          <p>
            {{
              esComite
                ? 'Vista del comité: trabajos, ejes y evaluaciones pendientes'
                : 'Vista ejecutiva de inscripciones, trabajos e interés por actividad'
            }}
          </p>
        </div>
      </div>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensajeAlerta) {
        <p class="ok">{{ mensajeAlerta }}</p>
      }

      @if (preCongreso) {
        <section class="panel-card">
          <h2>Pre-congreso — ¿todo listo?</h2>
          <p class="muted">
            Checklist de organización (programa, precheck, evaluaciones) y recordatorios a quien
            tiene tareas sin hacer.
          </p>
          @if (preCongreso.listo) {
            <p class="ok">No hay pendientes críticos detectados.</p>
          } @else {
            <div class="notice-box notice-box--amber">
              <ul class="report-list" style="margin: 0">
                @for (a of preCongreso.alertas; track a) {
                  <li>
                    <span>{{ a }}</span>
                  </li>
                }
              </ul>
            </div>
          }
          <div class="stats-grid" style="margin-top: 0.75rem">
            <div
              class="stat-card"
              [class.stat-card--verde]="preCongreso.programaPublicado"
              [class.stat-card--amarillo]="!preCongreso.programaPublicado"
            >
              <span class="stat-label">Programa</span>
              <span class="stat-value" style="font-size: 1rem">
                {{ preCongreso.programaPublicado ? 'Publicado' : 'Sin publicar' }}
              </span>
            </div>
            <div class="stat-card stat-card--gris">
              <span class="stat-label">Precheck</span>
              <span class="stat-value">{{ preCongreso.trabajosPendientesPrecheck }}</span>
            </div>
            <div class="stat-card stat-card--violeta">
              <span class="stat-label">Aprob. comité</span>
              <span class="stat-value">{{ preCongreso.trabajosPendientesAprobacionComite }}</span>
            </div>
            <div class="stat-card stat-card--azul">
              <span class="stat-label">Dictámenes</span>
              <span class="stat-value">{{ preCongreso.evaluacionesPendientes }}</span>
            </div>
            <div class="stat-card stat-card--amarillo">
              <span class="stat-label">Invitaciones</span>
              <span class="stat-value">{{ preCongreso.invitacionesEvaluacionPendientes }}</span>
            </div>
            <div class="stat-card stat-card--gris">
              <span class="stat-label">Insc. pendientes</span>
              <span class="stat-value">{{ preCongreso.inscripcionesPendientes }}</span>
            </div>
          </div>
          <div class="inline-form-row" style="margin-top: 1rem; flex-wrap: wrap; gap: 0.5rem">
            <button
              type="button"
              class="btn-primary"
              [disabled]="enviandoAlertas"
              (click)="avisarOrganizacion()"
            >
              Avisar a admin / comité
            </button>
            <button
              type="button"
              class="btn-primary"
              [disabled]="enviandoAlertas"
              (click)="recordarPendientes()"
            >
              Recordar a usuarios con pendientes
            </button>
            <button
              type="button"
              class="btn-link"
              [disabled]="enviandoAlertas"
              (click)="avisarTodo()"
            >
              {{ enviandoAlertas ? 'Enviando…' : 'Enviar ambos' }}
            </button>
          </div>
        </section>
      }

      @if (cargando) {
        <p>Cargando reporte...</p>
      } @else if (reporte) {
        <div class="panel-card panel-card-header-actions">
          <button type="button" class="btn-primary" (click)="descargarJson()">
            Descargar reporte JSON
          </button>
        </div>

        <div class="stats-grid">
          <div class="stat-card stat-card--gris">
            <span class="stat-label">Usuarios</span>
            <span class="stat-value">{{ reporte.kpi.usuariosTotales }}</span>
          </div>
          <div class="stat-card stat-card--amarillo">
            <span class="stat-label">Inscripciones pendientes</span>
            <span class="stat-value">{{ reporte.kpi.inscripcionesPendientes }}</span>
          </div>
          <div class="stat-card stat-card--verde">
            <span class="stat-label">Inscripciones confirmadas</span>
            <span class="stat-value">{{ reporte.kpi.inscripcionesConfirmadas }}</span>
          </div>
          <div class="stat-card stat-card--violeta">
            <span class="stat-label">Trabajos totales</span>
            <span class="stat-value">{{ reporte.kpi.trabajosTotales }}</span>
          </div>
          <div class="stat-card stat-card--azul">
            <span class="stat-label">Dictámenes pendientes</span>
            <span class="stat-value">{{ reporte.kpi.evaluacionesPendientes }}</span>
          </div>
          <div class="stat-card stat-card--amarillo">
            <span class="stat-label">Invitaciones sin respuesta</span>
            <span class="stat-value">{{ reporte.kpi.invitacionesEvaluacionPendientes }}</span>
          </div>
          <div class="stat-card stat-card--violeta">
            <span class="stat-label">Trabajos en evaluación</span>
            <span class="stat-value">{{ reporte.kpi.trabajosEnEvaluacion }}</span>
          </div>
          <div class="stat-card stat-card--gris">
            <span class="stat-label">Pendientes de precheck</span>
            <span class="stat-value">{{ reporte.kpi.trabajosPendientesPrecheck }}</span>
          </div>
        </div>

        <div class="report-grid">
          <section class="panel-card">
            <h2>Trabajos por eje temático</h2>
            @if (!reporte.trabajosPorEje?.length) {
              <p class="muted">Sin trabajos cargados.</p>
            } @else {
              <ul class="report-list">
                @for (row of reporte.trabajosPorEje; track row.label) {
                  <li>
                    <span>{{ row.label }}</span>
                    <strong>{{ row.count }} ({{ pct(row.count, reporte.kpi.trabajosTotales) }}%)</strong>
                  </li>
                }
              </ul>
            }
          </section>

          <section class="panel-card">
            <h2>Trabajos por estado</h2>
            @if (!reporte.trabajosPorEstado.length) {
              <p class="muted">Sin trabajos cargados.</p>
            } @else {
              <ul class="report-list">
                @for (row of reporte.trabajosPorEstado; track row.label) {
                  <li>
                    <span>{{ row.label }}</span>
                    <strong>{{ row.count }}</strong>
                  </li>
                }
              </ul>
            }
          </section>

          <section class="panel-card">
            <h2>Trabajos por tipo</h2>
            @if (!reporte.trabajosPorTipo.length) {
              <p class="muted">Sin trabajos cargados.</p>
            } @else {
              <ul class="report-list">
                @for (row of reporte.trabajosPorTipo; track row.label) {
                  <li>
                    <span>{{ row.label }}</span>
                    <strong>{{ row.count }} ({{ pct(row.count, reporte.kpi.trabajosTotales) }}%)</strong>
                  </li>
                }
              </ul>
            }
          </section>

          <section class="panel-card">
            <h2>Trabajos por modalidad</h2>
            @if (!reporte.trabajosPorModalidad.length) {
              <p class="muted">Sin trabajos cargados.</p>
            } @else {
              <ul class="report-list">
                @for (row of reporte.trabajosPorModalidad; track row.label) {
                  <li>
                    <span>{{ row.label }}</span>
                    <strong>{{ row.count }} ({{ pct(row.count, reporte.kpi.trabajosTotales) }}%)</strong>
                  </li>
                }
              </ul>
            }
          </section>

          <section class="panel-card">
            <h2>Inscripciones por categoría</h2>
            @if (!reporte.inscripcionesPorCategoria?.length) {
              <p class="muted">Sin datos de categoría.</p>
            } @else {
              <ul class="report-list">
                @for (row of reporte.inscripcionesPorCategoria; track row.label) {
                  <li>
                    <span>{{ row.label }}</span>
                    <strong
                      >{{ row.count }} ({{
                        pct(row.count, reporte.kpi.inscripcionesTotales)
                      }}%)</strong
                    >
                  </li>
                }
              </ul>
            }
          </section>

          <section class="panel-card">
            <h2>Inscripciones por provincia</h2>
            @if (!reporte.inscripcionesPorProvincia?.length) {
              <p class="muted">Sin datos de provincia.</p>
            } @else {
              <ul class="report-list">
                @for (row of reporte.inscripcionesPorProvincia; track row.label) {
                  <li>
                    <span>{{ row.label }}</span>
                    <strong>{{ row.count }}</strong>
                  </li>
                }
              </ul>
            }
          </section>

          <section class="panel-card">
            <h2>Inscripciones por institución (top 10)</h2>
            @if (!reporte.inscripcionesPorInstitucionTop10.length) {
              <p class="muted">Sin datos de institución.</p>
            } @else {
              <ul class="report-list">
                @for (row of reporte.inscripcionesPorInstitucionTop10; track row.institution) {
                  <li>
                    <span>{{ row.institution }}</span>
                    <strong>{{ row.count }}</strong>
                  </li>
                }
              </ul>
            }
          </section>

          <section class="panel-card">
            <h2>Inscripciones por estado y método</h2>
            <ul class="report-list">
              <li>
                <span>Pendientes (transferencia)</span>
                <strong>
                  {{ reporte.kpi.pagosTransferenciaPendientes }}
                  ({{
                    pct(reporte.kpi.pagosTransferenciaPendientes, reporte.kpi.inscripcionesTotales)
                  }}%)
                </strong>
              </li>
              <li>
                <span>Pendientes (efectivo)</span>
                <strong>
                  {{ reporte.kpi.pagosEfectivoPendientes }}
                  ({{ pct(reporte.kpi.pagosEfectivoPendientes, reporte.kpi.inscripcionesTotales) }}%)
                </strong>
              </li>
              <li>
                <span>Confirmadas (transferencia)</span>
                <strong>{{ reporte.kpi.pagosTransferenciaConfirmados }}</strong>
              </li>
              <li>
                <span>Confirmadas (efectivo)</span>
                <strong>{{ reporte.kpi.pagosEfectivoConfirmados }}</strong>
              </li>
            </ul>
          </section>
        </div>

        <section class="panel-card">
          <h2>Interés por actividad (en agendas personales)</h2>
          <p class="muted">
            Cuántas personas agregaron cada actividad a su cronograma personal.
          </p>
          @if (!reporte.interesPorActividad?.length) {
            <p class="muted">Todavía no hay actividades en agendas personales.</p>
          } @else {
            <ul class="report-list">
              @for (row of reporte.interesPorActividad; track row.label) {
                <li>
                  <span>{{ row.label }}</span>
                  <strong>{{ row.count }}</strong>
                </li>
              }
            </ul>
          }
        </section>

        @if (!esComite) {
          <section class="panel-card">
            <h2>Inscriptos adeudando pago ({{ reporte.deudores.length }})</h2>
            @if (!reporte.deudores.length) {
              <p class="muted">No hay inscriptos con pago pendiente.</p>
            } @else {
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Método</th>
                      <th>Categoría</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (d of reporte.deudores; track d.id) {
                      <tr>
                        <td>{{ d.id }}</td>
                        <td>{{ d.nombre }}</td>
                        <td>{{ d.email }}</td>
                        <td>{{ d.metodoPago }}</td>
                        <td>{{ d.categoria }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        }
      }

      <p>
        <a [routerLink]="volverLink">← {{ volverTexto }}</a>
      </p>
    </div>
  `,
})
export class AdminEstadisticasComponent implements OnInit {
  reporte?: AdminReport;
  preCongreso?: PreCongresoReadiness;
  cargando = true;
  error = '';
  mensajeAlerta = '';
  enviandoAlertas = false;
  esComite = false;

  constructor(
    private statsService: AdminStatsService,
    private route: ActivatedRoute
  ) {}

  get volverLink(): string {
    return this.esComite ? '/organizador' : '/admin';
  }

  get volverTexto(): string {
    return this.esComite ? 'Volver al panel del comité' : 'Volver al panel admin';
  }

  ngOnInit(): void {
    this.esComite = this.route.snapshot.data['vistaComite'] === true;
    this.statsService.obtenerPreCongreso().subscribe({
      next: (r) => (this.preCongreso = r),
      error: () => (this.preCongreso = undefined),
    });
    this.statsService.obtenerReporte().subscribe({
      next: (r) => {
        this.reporte = r;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar el reporte.');
        this.cargando = false;
      },
    });
  }

  avisarOrganizacion(): void {
    this.enviarAlertas(() => this.statsService.notificarOrganizacionPreCongreso());
  }

  recordarPendientes(): void {
    this.enviarAlertas(() => this.statsService.notificarPendientesPreCongreso());
  }

  avisarTodo(): void {
    this.enviarAlertas(() => this.statsService.notificarTodoPreCongreso());
  }

  private enviarAlertas(fn: () => Observable<AlertaEnvioResultado>): void {
    if (this.enviandoAlertas) return;
    this.enviandoAlertas = true;
    this.mensajeAlerta = '';
    this.error = '';
    fn().subscribe({
      next: (r) => {
        this.enviandoAlertas = false;
        this.mensajeAlerta = r.mensaje;
        this.statsService.obtenerPreCongreso().subscribe({
          next: (p) => (this.preCongreso = p),
        });
      },
      error: (err) => {
        this.enviandoAlertas = false;
        this.error = mensajeErrorApi(err, 'No se pudieron enviar las alertas.');
      },
    });
  }

  pct(part: number, total: number): number {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  }

  descargarJson(): void {
    if (!this.reporte) return;
    const blob = new Blob([JSON.stringify(this.reporte, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${this.esComite ? 'comite' : 'admin'}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
