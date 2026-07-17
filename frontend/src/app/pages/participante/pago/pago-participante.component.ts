import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { LoginService } from '../../../auth/login.service';
import { InscripcionCongreso, etiquetaCategoria } from '../../../models/inscripcion.model';
import { Pago } from '../../../models/pago.model';
import { InscripcionService } from '../../../servicios/inscripcion.service';
import { PagoService } from '../../../servicios/pago.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-pago-participante',
  standalone: true,
  imports: [CommonModule, RouterLink, ArchivoLinkComponent],
  template: `
    <section class="card">
      <h1>Estado de pago</h1>
      <p>Consulta del pago vinculado a tu inscripción al congreso.</p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (!inscripcion && !cargando) {
        <p>
          Todavía no completaste la inscripción.
          <a routerLink="/inscripcion">Inscribirme al congreso</a>
        </p>
      }

      @if (inscripcion) {
        <dl class="detalle">
          <dt>Inscripción</dt>
          <dd>#{{ inscripcion.id }} — {{ etiqueta(inscripcion.categoria) }} ({{ inscripcion.estado }})</dd>
        </dl>

        @if (pago) {
          <dl class="detalle">
            <dt>ID pago</dt>
            <dd>{{ pago.id }}</dd>
            <dt>Monto</dt>
            <dd>{{ pago.monto | number: '1.2-2' }}</dd>
            <dt>Método</dt>
            <dd>{{ pago.metodo }}</dd>
            <dt>Estado</dt>
            <dd>{{ pago.estado }}</dd>
            @if (pago.motivoRechazo) {
              <dt>Motivo rechazo</dt>
              <dd>{{ pago.motivoRechazo }}</dd>
            }
            <dt>Comprobante</dt>
            <dd>
              @if (pago.comprobanteUrl) {
                <app-archivo-link [url]="pago.comprobanteUrl" label="Ver comprobante" />
              } @else {
                Pago en efectivo / sin comprobante digital
              }
            </dd>
            @if (pago.requiereFactura) {
              <dt>Factura</dt>
              <dd>
                @if (pago.facturaUrl) {
                  <app-archivo-link [url]="pago.facturaUrl" label="Descargar factura" />
                } @else if (pago.estado === 'APROBADO') {
                  <span class="muted">Aún no disponible. Te avisaremos por email cuando esté lista.</span>
                } @else {
                  <span class="muted">Se emitirá tras aprobar el pago.</span>
                }
              </dd>
            }
          </dl>
        } @else if (!cargando) {
          <p class="muted">
            El pago se registra al enviar el formulario de
            <a routerLink="/inscripcion">inscripción al congreso</a>.
          </p>
        }
      }

      @if (cargando) {
        <p>Cargando...</p>
      }

      <p><a routerLink="/inscripcion">← Inscripción al congreso</a></p>
    </section>
  `,
})
export class PagoParticipanteComponent implements OnInit {
  inscripcion?: InscripcionCongreso;
  pago?: Pago;
  cargando = true;
  error = '';
  mensaje = '';
  usuarioId?: number;

  constructor(
    private loginService: LoginService,
    private pagoService: PagoService,
    private inscripcionService: InscripcionService
  ) {}

  ngOnInit(): void {
    this.usuarioId = this.loginService.getUser()?.id;
    if (!this.usuarioId) {
      this.error = 'Sesión inválida.';
      this.cargando = false;
      return;
    }
    this.cargarEstado();
  }

  etiqueta(categoria: string): string {
    return etiquetaCategoria(categoria);
  }

  private cargarEstado(): void {
    this.inscripcionService.misEstado().subscribe({
      next: (estado) => {
        this.inscripcion = estado.inscripcion ?? undefined;
        if (this.inscripcion?.pagoId && this.usuarioId) {
          this.pagoService.consultarEstadoPorUsuario(this.usuarioId).subscribe({
            next: (p) => {
              this.pago = p;
              this.cargando = false;
            },
            error: () => {
              this.pago = undefined;
              this.cargando = false;
            },
          });
        } else {
          this.pago = undefined;
          this.cargando = false;
        }
      },
      error: () => {
        this.inscripcion = undefined;
        this.pago = undefined;
        this.cargando = false;
      },
    });
  }
}
