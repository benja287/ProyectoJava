import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArqueoCaja } from '../../../models/pago.model';
import { PagoService } from '../../../servicios/pago.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-arqueo-caja',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="card">
      <h1>Arqueo de caja</h1>
      <p class="muted">
        Pagos en efectivo aprobados con recepción física confirmada. Contá el dinero y contrastá
        con el total del sistema.
      </p>

      <div class="inline-form-row" style="flex-wrap: wrap; gap: 0.75rem; margin: 1rem 0">
        <label>
          Desde
          <input type="date" [(ngModel)]="desde" [ngModelOptions]="{ standalone: true }" />
        </label>
        <label>
          Hasta
          <input type="date" [(ngModel)]="hasta" [ngModelOptions]="{ standalone: true }" />
        </label>
        <button type="button" class="btn-primary" (click)="consultar()" [disabled]="cargando">
          {{ cargando ? 'Consultando…' : 'Consultar' }}
        </button>
      </div>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      @if (reporte) {
        <div class="stats-grid" style="margin-bottom: 1rem">
          <div class="stat-card stat-card--verde">
            <span class="stat-label">Total cobrado</span>
            <span class="stat-value">{{ reporte.totalCobrado | number: '1.2-2' }}</span>
          </div>
          <div class="stat-card stat-card--gris">
            <span class="stat-label">Cantidad de cobros</span>
            <span class="stat-value">{{ reporte.cantidadPagos }}</span>
          </div>
        </div>

        @if (!reporte.items.length) {
          <p class="muted">No hay cobros en efectivo confirmados en ese rango.</p>
        } @else {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pago</th>
                  <th>Recibo</th>
                  <th>Monto</th>
                  <th>Fecha validación</th>
                  <th>Validado por</th>
                  <th>Efectivo físico</th>
                  <th>Obs.</th>
                </tr>
              </thead>
              <tbody>
                @for (item of reporte.items; track item.pagoId) {
                  <tr>
                    <td>
                      <a [routerLink]="['/admin/pagos', item.pagoId]">#{{ item.pagoId }}</a>
                    </td>
                    <td>{{ item.numeroRecibo || '—' }}</td>
                    <td>{{ item.monto | number: '1.2-2' }}</td>
                    <td>{{ formatearFecha(item.fechaValidacion) }}</td>
                    <td>{{ item.validadoPorNombre || '—' }}</td>
                    <td>{{ item.efectivoFisicoRecibido ? 'Sí' : 'No' }}</td>
                    <td>{{ item.observaciones || '—' }}</td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2"><strong>Total</strong></td>
                  <td colspan="5">
                    <strong>{{ reporte.totalCobrado | number: '1.2-2' }}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        }
      }

      <p style="margin-top: 1rem">
        <a routerLink="/admin/pagos">← Pagos pendientes</a>
        ·
        <a routerLink="/admin">Panel admin</a>
      </p>
    </section>
  `,
})
export class ArqueoCajaComponent implements OnInit {
  desde = '';
  hasta = '';
  reporte?: ArqueoCaja;
  cargando = false;
  error = '';

  constructor(private pagoService: PagoService) {}

  ngOnInit(): void {
    const hoy = new Date();
    const iso = hoy.toISOString().slice(0, 10);
    this.hasta = iso;
    const hace7 = new Date(hoy);
    hace7.setDate(hoy.getDate() - 7);
    this.desde = hace7.toISOString().slice(0, 10);
    this.consultar();
  }

  consultar(): void {
    if (!this.desde || !this.hasta) {
      this.error = 'Indicá desde y hasta.';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.pagoService.arqueoCaja(this.desde, this.hasta).subscribe({
      next: (r) => {
        this.reporte = r;
        this.cargando = false;
      },
      error: (err) => {
        this.reporte = undefined;
        this.error = mensajeErrorApi(err, 'No se pudo obtener el arqueo.');
        this.cargando = false;
      },
    });
  }

  formatearFecha(valor?: string | null): string {
    if (!valor) return '—';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return valor;
    return d.toLocaleString('es-AR');
  }
}
