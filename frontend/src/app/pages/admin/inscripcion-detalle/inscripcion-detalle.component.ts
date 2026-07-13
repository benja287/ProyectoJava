import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import {
  InscripcionCongreso,
  etiquetaCategoria,
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
          </dd>
          <dt>Institución</dt>
          <dd>{{ inscripcion.institucion || '—' }}</dd>
          <dt>Provincia</dt>
          <dd>{{ inscripcion.provincia || '—' }}</dd>
          <dt>Requiere factura</dt>
          <dd>{{ inscripcion.requiereFactura ? 'Sí' : 'No' }}</dd>
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
        <dl class="detalle">
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
            } @else {
              —
            }
          </dd>
        </dl>

        @if (inscripcion.estado === 'PENDIENTE') {
          <h2>Acciones</h2>
          <div class="actions">
            <button type="button" class="btn-ok" (click)="validar(true)" [disabled]="procesando">
              Aprobar
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

  etiqueta(categoria: string): string {
    return etiquetaCategoria(categoria);
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
    }
    this.procesando = true;
    this.error = '';
    this.mensaje = '';
    this.inscripcionService.validar(this.inscripcion.id, { aprobar, motivoRechazo }).subscribe({
      next: (actualizada) => {
        this.inscripcion = actualizada;
        this.mensaje = aprobar ? 'Inscripción aprobada.' : 'Inscripción rechazada.';
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
