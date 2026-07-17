import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import {
  InscripcionCongreso,
  esPagoEfectivo,
  etiquetaCategoria,
  etiquetaMetodoPago,
  etiquetaTipoParticipacion,
} from '../../../models/inscripcion.model';
import { InscripcionService } from '../../../servicios/inscripcion.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-inscripcion-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, ArchivoLinkComponent],
  template: `
    <section class="card">
      @if (cargando) {
        <p>Cargando inscripción...</p>
      } @else if (error && !inscripcion) {
        <p class="error">{{ error }}</p>
        <a routerLink="/admin/inscripciones">Volver al listado</a>
      } @else if (inscripcion) {
        <h1>Detalle de inscripción #{{ inscripcion.id }}</h1>

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
        @if (esEfectivo) {
          <p class="aviso-amarillo">
            <strong>Efectivo / presencial:</strong> no hay archivo: el asistente declaró pagar en caja
            o durante el congreso. Aprobá solo si ya verificaste el cobro en efectivo (recepción, caja
            o acreditación).
            @if (inscripcion.requiereFactura) {
              Si el usuario pidió factura, figura el aviso debajo del nombre.
            }
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
        </dl>

        @if (inscripcion.estado === 'PENDIENTE') {
          <h2>Acciones</h2>
          <div class="actions">
            <button type="button" class="btn-ok" (click)="validar(true)" [disabled]="procesando">
              {{ esEfectivo ? 'Aprobar (cobro efectivo OK)' : 'Aprobar' }}
            </button>
            <button type="button" class="btn-warn" (click)="validar(false)" [disabled]="procesando">
              Rechazar
            </button>
          </div>
        }

        <p><a routerLink="/admin/inscripciones">← Volver al listado</a></p>
      }
    </section>
  `,
})
export class InscripcionDetalleComponent implements OnInit, OnDestroy {
  inscripcion?: InscripcionCongreso;
  cargando = true;
  error = '';
  mensaje = '';
  procesando = false;
  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private inscripcionService: InscripcionService
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

  validar(aprobar: boolean): void {
    if (!this.inscripcion?.id || this.procesando) {
      return;
    }
    let motivoRechazo: string | undefined;
    if (!aprobar) {
      motivoRechazo = prompt('Motivo del rechazo:') ?? undefined;
      if (!motivoRechazo) {
        return;
      }
    } else if (this.esEfectivo) {
      const ok = confirm(
        '¿Confirmás que ya verificaste el cobro en efectivo (caja / recepción / acreditación)?\n\nAl aprobar, el usuario pasa a Asistente.'
      );
      if (!ok) {
        return;
      }
    }
    this.procesando = true;
    this.error = '';
    this.mensaje = '';
    this.inscripcionService.validar(this.inscripcion.id, { aprobar, motivoRechazo }).subscribe({
      next: (actualizada) => {
        this.inscripcion = actualizada;
        this.mensaje = aprobar ? 'Inscripción aprobada. El usuario ahora es Asistente.' : 'Inscripción rechazada.';
        this.procesando = false;
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
