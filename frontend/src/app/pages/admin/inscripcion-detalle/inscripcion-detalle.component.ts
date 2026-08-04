import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import {
  ValidacionEfectivoModalComponent,
  ValidacionEfectivoResultado,
} from '../../../components/validacion-efectivo-modal/validacion-efectivo-modal.component';
import {
  InscripcionCongreso,
  esPagoEfectivo,
  etiquetaCategoria,
  etiquetaMetodoPago,
  etiquetaTipoParticipacion,
} from '../../../models/inscripcion.model';
import { InscripcionService } from '../../../servicios/inscripcion.service';
import { PagoService } from '../../../servicios/pago.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-inscripcion-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, ArchivoLinkComponent, ValidacionEfectivoModalComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">📋</span>
        <div>
          <h1>Detalle de inscripción</h1>
          <p>Datos del participante, pago y validación</p>
        </div>
      </div>

      <section class="panel-card">
      @if (cargando) {
        <p>Cargando inscripción...</p>
      } @else if (error && !inscripcion) {
        <p class="error">{{ error }}</p>
      } @else if (inscripcion) {
        <h2>Inscripción #{{ inscripcion.id }}</h2>

        @if (error) {
          <p class="error">{{ error }}</p>
        }
        @if (mensaje) {
          <p class="ok">{{ mensaje }}</p>
        }

        <h2>Datos de la inscripción</h2>
        <dl class="detalle">
          <dt>Estado</dt>
          <dd>{{ inscripcion.estado || '—' }}</dd>
          <dt>Categoría</dt>
          <dd>{{ etiqueta(inscripcion.categoria) }}</dd>
          <dt>Participante</dt>
          <dd>
            @if (inscripcion.usuarioId) {
              <a [routerLink]="['/admin/usuarios', inscripcion.usuarioId]">
                {{ inscripcion.usuarioApellido }}, {{ inscripcion.usuarioNombre }}
              </a>
            } @else {
              {{ inscripcion.usuarioApellido }}, {{ inscripcion.usuarioNombre }}
            }
            <br />
            <span class="muted">{{ inscripcion.usuarioEmail }}</span>
            @if (inscripcion.usuarioTelefono) {
              <br />
              <span class="muted small">Tel: {{ inscripcion.usuarioTelefono }}</span>
            }
            @if (inscripcion.usuarioTipoIdentificacion || inscripcion.usuarioNumeroIdentificacion) {
              <br />
              <span class="muted small">
                {{ inscripcion.usuarioTipoIdentificacion }}
                {{ inscripcion.usuarioNumeroIdentificacion }}
                @if (inscripcion.usuarioNacionalidad) {
                  · {{ inscripcion.usuarioNacionalidad }}
                }
              </span>
            }
            @if (inscripcion.requiereFactura) {
              <br />
              <span class="muted small"><strong>Solicitó factura</strong></span>
            }
          </dd>
          <dt>Participación declarada</dt>
          <dd>{{ resumenParticipacion(inscripcion) }}</dd>
          <dt>Institución</dt>
          <dd>{{ inscripcion.institucion || '—' }}</dd>
          <dt>Provincia</dt>
          <dd>{{ inscripcion.provincia || '—' }}</dd>
          <dt>Requiere factura</dt>
          <dd>{{ inscripcion.requiereFactura ? 'Sí' : 'No' }}</dd>
          @if (inscripcion.requiereFactura) {
            <dt>Razón social</dt>
            <dd>{{ inscripcion.facturaRazonSocial || '—' }}</dd>
            <dt>CUIT</dt>
            <dd>{{ inscripcion.facturaCuit || '—' }}</dd>
            <dt>Condición IVA</dt>
            <dd>{{ inscripcion.facturaCondicionIva || '—' }}</dd>
            <dt>Domicilio fiscal</dt>
            <dd>{{ inscripcion.facturaDomicilioFiscal || '—' }}</dd>
          }
          <dt>Fecha solicitud</dt>
          <dd>{{ inscripcion.fechaSolicitud || '—' }}</dd>
          <dt>Motivo rechazo</dt>
          <dd>{{ inscripcion.motivoRechazo || '—' }}</dd>
          <dt>Certificado</dt>
          <dd>
            @if (inscripcion.certificadoUrl) {
              <app-archivo-link [url]="inscripcion.certificadoUrl" label="Ver certificado" />
            } @else {
              —
            }
          </dd>
        </dl>

        <h2>Pago vinculado</h2>
        @if (esEfectivo && inscripcion.estado === 'PENDIENTE') {
          <p class="aviso-amarillo">
            <strong>Efectivo / presencial:</strong> no hay archivo: el asistente declaró pagar en caja
            o durante el congreso. Usá «Validar pago efectivo» y confirmá la recepción física; el
            recibo lo asigna el sistema.
          </p>
        }
        <dl class="detalle">
          <dt>Forma de pago</dt>
          <dd>{{ etiquetaMetodo(inscripcion.pagoMetodo) }}</dd>
          <dt>Pago</dt>
          <dd>
            @if (inscripcion.pagoId) {
              <a [routerLink]="['/admin/pagos', inscripcion.pagoId]">#{{ inscripcion.pagoId }}</a>
              — {{ inscripcion.pagoEstado || '—' }}
              @if (inscripcion.pagoMonto != null) {
                ({{ inscripcion.pagoMonto | number: '1.2-2' }})
              }
            } @else {
              Sin pago
            }
          </dd>
          <dt>Comprobante</dt>
          <dd>
            @if (inscripcion.pagoComprobanteUrl) {
              <app-archivo-link [url]="inscripcion.pagoComprobanteUrl" label="Ver comprobante" />
            } @else if (esEfectivo) {
              Sin archivo (correcto para efectivo)
            } @else {
              —
            }
          </dd>
          @if (inscripcion.requiereFactura) {
            <dt>Factura</dt>
            <dd>
              @if (inscripcion.pagoFacturaUrl) {
                <app-archivo-link [url]="inscripcion.pagoFacturaUrl" label="Ver factura" />
              } @else {
                <span class="muted">Pendiente de emitir / adjuntar</span>
              }
            </dd>
          }
        </dl>

        @if (
          inscripcion.requiereFactura &&
          inscripcion.pagoId &&
          inscripcion.pagoEstado === 'APROBADO'
        ) {
          <h2>Enviar factura al participante</h2>
          <p class="muted">
            Subí el PDF emitido. Se notifica por campana y email para que lo descargue en Estado de
            pago.
          </p>
          <div class="inline-form-row" style="gap: 0.75rem; flex-wrap: wrap; align-items: center">
            <input
              type="file"
              accept=".pdf,application/pdf"
              (change)="onFacturaSeleccionada($event)"
              [disabled]="procesando || subiendoFactura"
            />
            <button
              type="button"
              class="btn-ok"
              (click)="subirFactura()"
              [disabled]="!archivoFactura || procesando || subiendoFactura"
            >
              {{
                subiendoFactura
                  ? 'Enviando…'
                  : inscripcion.pagoFacturaUrl
                    ? 'Reemplazar y notificar'
                    : 'Adjuntar y notificar'
              }}
            </button>
          </div>
        }

        @if (mostrarInfoPagoAuditada) {
          <h2>Información de pago</h2>
          <dl class="detalle">
            <dt>Validado por</dt>
            <dd>{{ inscripcion.pagoValidadoPorNombre || '—' }}</dd>
            <dt>Fecha</dt>
            <dd>{{ formatearFecha(inscripcion.pagoFechaValidacion) }}</dd>
            <dt>Recibo</dt>
            <dd>{{ inscripcion.pagoNumeroRecibo || '—' }}</dd>
            <dt>Efectivo físico recibido</dt>
            <dd>{{ inscripcion.pagoEfectivoFisicoRecibido ? 'Sí' : 'No' }}</dd>
            @if (inscripcion.pagoObservacionesValidacion) {
              <dt>Observaciones</dt>
              <dd>{{ inscripcion.pagoObservacionesValidacion }}</dd>
            }
          </dl>
        }

        @if (inscripcion.estado === 'PENDIENTE') {
          <h2>Acciones</h2>
          <div class="actions">
            <button
              type="button"
              class="btn-ok"
              (click)="iniciarAprobacion()"
              [disabled]="procesando"
            >
              {{ esEfectivo ? 'Validar pago efectivo' : 'Aprobar' }}
            </button>
            <button type="button" class="btn-warn" (click)="validar(false)" [disabled]="procesando">
              Rechazar
            </button>
          </div>
        }
      }
      </section>

      <p class="panel-volver"><a routerLink="/admin/inscripciones">← Volver al listado</a></p>
    </div>

    <app-validacion-efectivo-modal
      #modalEfectivo
      [abierto]="modalEfectivoAbierto"
      [disabled]="procesando"
      (confirmarValidacion)="onConfirmarEfectivo($event)"
      (cancelar)="cerrarModalEfectivo()"
    />
  `,
})
export class InscripcionDetalleComponent implements OnInit, OnDestroy {
  @ViewChild('modalEfectivo') modalEfectivo?: ValidacionEfectivoModalComponent;

  inscripcion?: InscripcionCongreso;
  cargando = true;
  error = '';
  mensaje = '';
  procesando = false;
  subiendoFactura = false;
  archivoFactura?: File;
  modalEfectivoAbierto = false;
  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private inscripcionService: InscripcionService,
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

  get esEfectivo(): boolean {
    return this.inscripcion ? esPagoEfectivo(this.inscripcion) : false;
  }

  get mostrarInfoPagoAuditada(): boolean {
    return (
      !!this.inscripcion &&
      (this.inscripcion.pagoEstado === 'APROBADO' ||
        !!this.inscripcion.pagoNumeroRecibo ||
        !!this.inscripcion.pagoValidadoPorNombre)
    );
  }

  etiqueta(categoria: string): string {
    return etiquetaCategoria(categoria);
  }

  etiquetaMetodo(metodo?: string | null): string {
    return etiquetaMetodoPago(metodo);
  }

  resumenParticipacion(i: InscripcionCongreso): string {
    const tipos = (i.tiposParticipacion || []).map(etiquetaTipoParticipacion).join(', ');
    if (i.participacionOtro) {
      return `${tipos || 'Otro'} (${i.participacionOtro})`;
    }
    return tipos || '—';
  }

  formatearFecha(valor?: string | null): string {
    if (!valor) return '—';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return valor;
    return d.toLocaleString('es-AR');
  }

  iniciarAprobacion(): void {
    if (this.esEfectivo) {
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

  onFacturaSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoFactura = input.files?.[0] ?? undefined;
  }

  subirFactura(): void {
    if (!this.inscripcion?.pagoId || !this.archivoFactura || this.subiendoFactura) {
      return;
    }
    this.subiendoFactura = true;
    this.error = '';
    this.mensaje = '';
    this.pagoService.adjuntarFactura(this.inscripcion.pagoId, this.archivoFactura).subscribe({
      next: (pago) => {
        if (this.inscripcion) {
          this.inscripcion = {
            ...this.inscripcion,
            pagoFacturaUrl: pago.facturaUrl ?? null,
          };
        }
        this.archivoFactura = undefined;
        this.mensaje =
          'Factura adjuntada. El participante recibió aviso en la plataforma y por email.';
        this.subiendoFactura = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo adjuntar la factura.');
        this.subiendoFactura = false;
      },
    });
  }

  validar(
    aprobar: boolean,
    numeroRecibo?: string,
    observaciones?: string,
    efectivoFisicoRecibido?: boolean
  ): void {
    if (!this.inscripcion?.id || this.procesando) {
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
    this.inscripcionService
      .validar(this.inscripcion.id, {
        aprobar,
        motivoRechazo,
        numeroRecibo,
        observaciones,
        efectivoFisicoRecibido,
      })
      .subscribe({
        next: (actualizada) => {
          this.inscripcion = actualizada;
          const recibo = actualizada.pagoNumeroRecibo ?? numeroRecibo;
          this.mensaje = aprobar
            ? recibo
              ? `Inscripción aprobada. Recibo ${recibo} registrado. El usuario ahora es Asistente.`
              : 'Inscripción aprobada. El usuario ahora es Asistente.'
            : 'Inscripción rechazada.';
          this.procesando = false;
          this.modalEfectivoAbierto = false;
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo validar la inscripción.');
          this.procesando = false;
        },
      });
  }

  private cargar(id: number): void {
    this.cargando = true;
    this.error = '';
    this.mensaje = '';
    this.inscripcionService.buscar(id).subscribe({
      next: (i) => {
        this.inscripcion = i;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'Inscripción no encontrada');
        this.cargando = false;
      },
    });
  }
}
