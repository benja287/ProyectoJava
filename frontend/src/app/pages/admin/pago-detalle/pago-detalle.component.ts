import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { Pago } from '../../../models/pago.model';
import { PagoService } from '../../../servicios/pago.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-pago-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, ArchivoLinkComponent],
  template: `
    <section class="card">
      @if (cargando) {
        <p>Cargando pago...</p>
      } @else if (error && !pago) {
        <p class="error">{{ error }}</p>
        <a routerLink="/admin/pagos/todos">Volver al listado</a>
      } @else if (pago) {
        <h1>Detalle de pago #{{ pago.id }}</h1>

        @if (error) {
          <p class="error">{{ error }}</p>
        }
        @if (mensaje) {
          <p class="ok">{{ mensaje }}</p>
        }

        <h2>Datos del pago</h2>
        <dl class="detalle">
          <dt>Estado</dt>
          <dd>
            <span
              [class.badge-ok]="pago.estado === 'APROBADO'"
              [class.badge-off]="pago.estado === 'RECHAZADO'"
            >
              {{ pago.estado || '—' }}
            </span>
          </dd>
          <dt>Monto</dt>
          <dd>{{ pago.monto | number: '1.2-2' }}</dd>
          <dt>Método</dt>
          <dd>{{ pago.metodo || '—' }}</dd>
          <dt>Requiere factura</dt>
          <dd>{{ pago.requiereFactura ? 'Sí' : 'No' }}</dd>
          <dt>Fecha registro</dt>
          <dd>{{ pago.fechaRegistro || '—' }}</dd>
          <dt>Motivo rechazo</dt>
          <dd>{{ pago.motivoRechazo || '—' }}</dd>
          <dt>ID asociación</dt>
          <dd>{{ pago.idAsociacion || '—' }}</dd>
          <dt>Comprobante</dt>
          <dd>
            @if (pago.comprobanteUrl) {
              <app-archivo-link [url]="pago.comprobanteUrl" label="Ver comprobante" />
            } @else {
              —
            }
          </dd>
        </dl>

        <h2>Acciones</h2>
        <div class="actions">
          @if (pago.estado === 'PENDIENTE') {
            <button type="button" class="btn-ok" (click)="validar(true)" [disabled]="procesando">
              Aprobar
            </button>
            <button type="button" class="btn-warn" (click)="validar(false)" [disabled]="procesando">
              Rechazar
            </button>
          }
          <button type="button" class="btn-warn" (click)="eliminar()" [disabled]="procesando">
            Eliminar pago
          </button>
        </div>

        <p>
          <a routerLink="/admin/pagos">← Pagos pendientes</a>
          ·
          <a routerLink="/admin/pagos/todos">Listado de pagos</a>
        </p>
      }
    </section>
  `,
})
export class PagoDetalleComponent implements OnInit, OnDestroy {
  pago?: Pago;
  cargando = true;
  error = '';
  mensaje = '';
  procesando = false;
  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pagoService: PagoService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id) {
        this.error = 'ID inválido';
        this.cargando = false;
        return;
      }
      this.cargar(id);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  validar(aprobar: boolean): void {
    if (!this.pago?.id) {
      return;
    }
    let motivoRechazo: string | undefined;
    if (!aprobar) {
      motivoRechazo = prompt('Motivo del rechazo:') ?? undefined;
      if (!motivoRechazo) {
        return;
      }
    }
    this.procesando = true;
    this.error = '';
    this.mensaje = '';
    this.pagoService.validar(this.pago.id, { aprobar, motivoRechazo }).subscribe({
      next: (res) => {
        this.pago = res.pago;
        this.mensaje = res.mensaje;
        this.procesando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo validar el pago.');
        this.procesando = false;
      },
    });
  }

  eliminar(): void {
    if (!this.pago?.id || !confirm(`¿Eliminar pago #${this.pago.id}?`)) {
      return;
    }
    this.procesando = true;
    this.error = '';
    this.mensaje = '';
    this.pagoService.baja(this.pago.id).subscribe({
      next: () => {
        this.router.navigate(['/admin/pagos/todos']);
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar el pago.');
        this.procesando = false;
      },
    });
  }

  private cargar(id: number): void {
    this.cargando = true;
    this.error = '';
    this.mensaje = '';
    this.pagoService.buscar(id).subscribe({
      next: (p) => {
        this.pago = p;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'Pago no encontrado');
        this.cargando = false;
      },
    });
  }
}
