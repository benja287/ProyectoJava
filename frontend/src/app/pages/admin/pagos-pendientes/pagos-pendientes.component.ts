import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Pago } from '../../../models/pago.model';
import { PagoService } from '../../../servicios/pago.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { PagoFilaComponent } from './pago-fila.component';

@Component({
  selector: 'app-pagos-pendientes',
  standalone: true,
  imports: [CommonModule, RouterLink, PagoFilaComponent],
  template: `
    <section class="card">
      <h1>Pagos pendientes de validación</h1>
      <p>Admin — GET <code>/api/pagos/pendientes</code></p>

      @if (cargando) {
        <p>Cargando...</p>
      }
      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (!cargando && pagos.length === 0) {
        <p>No hay pagos pendientes.</p>
      }

      @if (pagos.length > 0) {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Comprobante</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (p of pagos; track p.id) {
              <app-pago-fila [pago]="p" (aprobar)="validar(p, true)" (rechazar)="validar(p, false)" />
            }
          </tbody>
        </table>
      }

      <p><a routerLink="/admin">← Menú admin</a></p>
    </section>
  `,
})
export class PagosPendientesComponent implements OnInit {
  pagos: Pago[] = [];
  cargando = true;
  error = '';
  mensaje = '';

  constructor(private pagoService: PagoService) {}

  ngOnInit(): void {
    this.cargar();
  }

  validar(pago: Pago, aprobar: boolean): void {
    if (!pago.id) {
      return;
    }
    let motivoRechazo: string | undefined;
    if (!aprobar) {
      motivoRechazo = prompt('Motivo del rechazo:') ?? undefined;
      if (!motivoRechazo) {
        return;
      }
    }
    this.pagoService.validar(pago.id, { aprobar, motivoRechazo }).subscribe({
      next: (res) => {
        this.mensaje = res.mensaje;
        this.cargar();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo validar el pago.');
      },
    });
  }

  private cargar(): void {
    this.cargando = true;
    this.error = '';
    this.pagoService.listarPendientes().subscribe({
      next: (items) => {
        this.pagos = items;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'Error al cargar pagos pendientes.');
        this.cargando = false;
      },
    });
  }
}
