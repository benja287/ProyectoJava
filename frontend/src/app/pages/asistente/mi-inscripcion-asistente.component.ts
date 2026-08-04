import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../components/archivo-link/archivo-link.component';
import {
  InscripcionCongreso,
  etiquetaCategoria,
  etiquetaMetodoPago,
  etiquetaTipoParticipacion,
} from '../../models/inscripcion.model';
import { InscripcionService } from '../../servicios/inscripcion.service';
import { mensajeErrorApi } from '../../utils/api-error.util';

@Component({
  selector: 'app-mi-inscripcion-asistente',
  standalone: true,
  imports: [CommonModule, RouterLink, ArchivoLinkComponent],
  template: `
    <div class="panel-page asistente-subvista">
      <div class="panel-hero panel-hero--admin asistente-sub-hero">
        <span class="panel-hero-icon" aria-hidden="true">🧾</span>
        <div>
          <h1>Mi inscripción al congreso</h1>
          <p>Datos de inscripción, recibo de caja y factura</p>
        </div>
      </div>
      <p class="panel-volver"><a routerLink="/asistente">← Volver al panel</a></p>

      <section class="panel-card">
      <p class="muted">
        Datos de tu inscripción, recibo de caja (si pagaste en efectivo) y factura cuando la
        organización la adjunte.
      </p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (cargando) {
        <p>Cargando…</p>
      } @else if (inscripcion) {
        <h2>Inscripción</h2>
        <dl class="detalle">
          <dt>Nº inscripción</dt>
          <dd>#{{ inscripcion.id }}</dd>
          <dt>Estado</dt>
          <dd>
            <span
              [class.badge-ok]="inscripcion.estado === 'APROBADA'"
              [class.badge-off]="inscripcion.estado === 'RECHAZADA'"
            >
              {{ inscripcion.estado || '—' }}
            </span>
          </dd>
          <dt>Categoría</dt>
          <dd>{{ etiqueta(inscripcion.categoria) }}</dd>
          <dt>Participación</dt>
          <dd>{{ resumenParticipacion(inscripcion) }}</dd>
          <dt>Institución</dt>
          <dd>{{ inscripcion.institucion || '—' }}</dd>
          <dt>Provincia</dt>
          <dd>{{ inscripcion.provincia || '—' }}</dd>
          <dt>Fecha solicitud</dt>
          <dd>{{ inscripcion.fechaSolicitud || '—' }}</dd>
        </dl>

        <h2>Pago</h2>
        <dl class="detalle">
          <dt>Forma de pago</dt>
          <dd>{{ etiquetaMetodo(inscripcion.pagoMetodo) }}</dd>
          <dt>Estado del pago</dt>
          <dd>{{ inscripcion.pagoEstado || '—' }}</dd>
          <dt>Monto</dt>
          <dd>
            @if (inscripcion.pagoMonto != null) {
              {{ inscripcion.pagoMonto | number: '1.2-2' }}
            } @else {
              —
            }
          </dd>
          <dt>Recibo de caja</dt>
          <dd>
            @if (inscripcion.pagoNumeroRecibo) {
              <strong>{{ inscripcion.pagoNumeroRecibo }}</strong>
            } @else if (inscripcion.pagoMetodo === 'EFECTIVO') {
              <span class="muted">Se asigna al aprobar el cobro en efectivo.</span>
            } @else {
              —
            }
          </dd>
          @if (inscripcion.pagoFechaValidacion) {
            <dt>Fecha de validación</dt>
            <dd>{{ formatearFecha(inscripcion.pagoFechaValidacion) }}</dd>
          }
          @if (inscripcion.pagoValidadoPorNombre) {
            <dt>Validado por</dt>
            <dd>{{ inscripcion.pagoValidadoPorNombre }}</dd>
          }
          <dt>Comprobante</dt>
          <dd>
            @if (inscripcion.pagoComprobanteUrl) {
              <app-archivo-link [url]="inscripcion.pagoComprobanteUrl" label="Ver comprobante" />
            } @else if (inscripcion.pagoMetodo === 'EFECTIVO') {
              Pago en efectivo (sin comprobante digital)
            } @else {
              —
            }
          </dd>
        </dl>

        <h2>Factura</h2>
        @if (!inscripcion.requiereFactura) {
          <p class="muted">No solicitaste factura al inscribirte.</p>
        } @else {
          <dl class="detalle">
            <dt>Razón social</dt>
            <dd>{{ inscripcion.facturaRazonSocial || '—' }}</dd>
            <dt>CUIT</dt>
            <dd>{{ inscripcion.facturaCuit || '—' }}</dd>
            <dt>Condición IVA</dt>
            <dd>{{ inscripcion.facturaCondicionIva || '—' }}</dd>
            <dt>Domicilio fiscal</dt>
            <dd>{{ inscripcion.facturaDomicilioFiscal || '—' }}</dd>
            <dt>PDF de factura</dt>
            <dd>
              @if (inscripcion.pagoFacturaUrl) {
                <app-archivo-link [url]="inscripcion.pagoFacturaUrl" label="Descargar factura" />
              } @else {
                <span class="muted">
                  Todavía no está disponible. Te avisaremos por campana y email cuando la
                  organización la cargue.
                </span>
              }
            </dd>
          </dl>
        }
      } @else {
        <p class="muted">No encontramos una inscripción asociada a tu usuario.</p>
      }

      </section>
    </div>
  `,
})
export class MiInscripcionAsistenteComponent implements OnInit {
  inscripcion?: InscripcionCongreso;
  cargando = true;
  error = '';

  constructor(private inscripcionService: InscripcionService) {}

  ngOnInit(): void {
    this.inscripcionService.misEstado().subscribe({
      next: (estado) => {
        this.inscripcion = estado.inscripcion ?? undefined;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar tu inscripción.');
        this.cargando = false;
      },
    });
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
}
