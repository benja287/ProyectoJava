import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminReport } from '../../../models/notificacion.model';
import { AdminStatsService } from '../../../servicios/admin-stats.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-admin-estadisticas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">📊</span>
        <div>
          <h1>Estadísticas y reportes</h1>
          <p>Vista ejecutiva de inscripciones y trabajos</p>
        </div>
      </div>

      @if (error) {
        <p class="error">{{ error }}</p>
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
        </div>

        <div class="report-grid">
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
                  ({{ pct(reporte.kpi.pagosTransferenciaPendientes, reporte.kpi.inscripcionesTotales) }}%)
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

      <p><a routerLink="/admin">← Volver al panel admin</a></p>
    </div>
  `,
})
export class AdminEstadisticasComponent implements OnInit {
  reporte?: AdminReport;
  cargando = true;
  error = '';

  constructor(private statsService: AdminStatsService) {}

  ngOnInit(): void {
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
    a.download = `reporte-admin-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
