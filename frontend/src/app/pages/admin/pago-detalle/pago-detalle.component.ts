import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import {
  ValidacionEfectivoModalComponent,
  ValidacionEfectivoResultado,
} from '../../../components/validacion-efectivo-modal/validacion-efectivo-modal.component';
import { Pago } from '../../../models/pago.model';
import { PagoService } from '../../../servicios/pago.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-pago-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, ArchivoLinkComponent, ValidacionEfectivoModalComponent],
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
            } @else if (pago.metodo === 'EFECTIVO') {
              Sin archivo (efectivo)
            } @else {
              —
            }
          </dd>
        </dl>

        @if (mostrarInfoAuditada) {
          <h2>Información de pago</h2>
          <dl class="detalle">
            <dt>Validado por</dt>
            <dd>{{ pago.validadoPorNombre || '—' }}</dd>
            <dt>Fecha</dt>
            <dd>{{ formatearFecha(pago.fechaValidacion) }}</dd>
            <dt>Recibo</dt>
            <dd>{{ pago.numeroRecibo || '—' }}</dd>
            <dt>Efectivo físico recibido</dt>
            <dd>{{ pago.efectivoFisicoRecibido ? 'Sí' : 'No' }}</dd>
            @if (pago.observacionesValidacion) {
              <dt>Observaciones</dt>
              <dd>{{ pago.observacionesValidacion }}</dd>
            }
          </dl>
        }

        <h2>Acciones</h2>
        <div class="actions">
          @if (pago.estado === 'PENDIENTE') {
            <button type="button" class="btn-ok" (click)="iniciarAprobacion()" [disabled]="procesando">
              {{ pago.metodo === 'EFECTIVO' ? 'Validar pago efectivo' : 'Aprobar' }}
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

    <app-validacion-efectivo-modal
      #modalEfectivo
      [abierto]="modalEfectivoAbierto"
      [disabled]="procesando"
      (confirmarValidacion)="onConfirmarEfectivo($event)"
      (cancelar)="cerrarModalEfectivo()"
    />
  `,
})
export class PagoDetalleComponent implements OnInit, OnDestroy {
  @ViewChild('modalEfectivo') modalEfectivo?: ValidacionEfectivoModalComponent;

  pago?: Pago;
  cargando = true;
  error = '';
  mensaje = '';
  procesando = false;
  modalEfectivoAbierto = false;
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

  get mostrarInfoAuditada(): boolean {
    return (
      !!this.pago &&
      (this.pago.estado === 'APROBADO' ||
        !!this.pago.numeroRecibo ||
        !!this.pago.validadoPorNombre)
    );
  }

  formatearFecha(valor?: string | null): string {
    if (!valor) return '—';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return valor;
    return d.toLocaleString('es-AR');
  }

  iniciarAprobacion(): void {
    if (this.pago?.metodo === 'EFECTIVO') {
      this.modalEfectivo?.reset();
      this.modalEfectivoAbierto = true;
      return;
    }
    this.validar(true);
  }

  onConfirmarEfectivo(data: ValidacionEfectivoResultado): void {
    // El backend asigna REC-AAAA-NNNNN en la misma transacción.
    this.validar(true, undefined, data.observaciones, data.efectivoFisicoRecibido);
  }

  cerrarModalEfectivo(): void {
    this.modalEfectivoAbierto = false;
  }

  validar(
    aprobar: boolean,
    numeroRecibo?: string,
    observaciones?: string,
    efectivoFisicoRecibido?: boolean
  ): void {
    if (!this.pago?.id || this.procesando) {
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
    this.pagoService
      .validar(this.pago.id, {
        aprobar,
        motivoRechazo,
        numeroRecibo,
        observaciones,
        efectivoFisicoRecibido,
      })
      .subscribe({
        next: (res) => {
          this.pago = res.pago;
          this.mensaje = res.mensaje;
          this.procesando = false;
          this.modalEfectivoAbierto = false;
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo validar el pago.');
          this.procesando = false;
        },
      });
  }

  eliminar(): void {
    if (!this.pago?.id || this.procesando || !confirm(`¿Eliminar pago #${this.pago.id}?`)) {
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
