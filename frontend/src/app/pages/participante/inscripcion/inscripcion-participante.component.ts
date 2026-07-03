import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import {
  CATEGORIAS_INSCRIPCION,
  InscripcionCongreso,
  categoriaRequiereCertificado,
  etiquetaCategoria,
} from '../../../models/inscripcion.model';
import { InscripcionService } from '../../../servicios/inscripcion.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-inscripcion-participante',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ArchivoLinkComponent],
  template: `
    <section class="card">
      <h1>Inscripción al congreso</h1>
      <p>Participante — <code>POST /api/inscripciones</code></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (inscripcion && !mostrarFormulario) {
        <h2>Estado de tu inscripción</h2>
        <dl class="detalle">
          <dt>ID</dt>
          <dd>{{ inscripcion.id }}</dd>
          <dt>Categoría</dt>
          <dd>{{ etiqueta(inscripcion.categoria) }}</dd>
          <dt>Estado</dt>
          <dd>{{ inscripcion.estado }}</dd>
          <dt>Institución</dt>
          <dd>{{ inscripcion.institucion || '—' }}</dd>
          <dt>Provincia</dt>
          <dd>{{ inscripcion.provincia || '—' }}</dd>
          <dt>Requiere factura</dt>
          <dd>{{ inscripcion.requiereFactura ? 'Sí' : 'No' }}</dd>
          @if (inscripcion.motivoRechazo) {
            <dt>Motivo rechazo</dt>
            <dd>{{ inscripcion.motivoRechazo }}</dd>
          }
          <dt>Certificado</dt>
          <dd>
            @if (inscripcion.certificadoUrl) {
              <app-archivo-link [url]="inscripcion.certificadoUrl" label="Ver certificado" />
            } @else {
              —
            }
          </dd>
        </dl>

        @if (inscripcion.estado === 'RECHAZADA') {
          <p class="actions-top">
            <button type="button" (click)="reiniciarFormulario()">Nueva inscripción</button>
          </p>
        } @else {
          <p class="muted">
            @if (!inscripcion.pagoId) {
              Una vez confirmada la solicitud, registrá el pago en
              <a routerLink="/participante/pago">Estado de pago</a>.
            } @else {
              Pago registrado (estado: {{ inscripcion.pagoEstado }}).
              <a routerLink="/participante/pago">Ver detalle</a>
            }
          </p>
        }
      }

      @if (mostrarFormulario) {
        <h2>{{ inscripcion ? 'Nueva inscripción' : 'Completar inscripción' }}</h2>
        <form [formGroup]="form" (ngSubmit)="enviar()" class="form-grid">
          <label>
            Categoría
            <select formControlName="categoria">
              @for (c of categorias; track c.value) {
                <option [value]="c.value">{{ c.label }}</option>
              }
            </select>
          </label>
          <label>
            Institución
            <input formControlName="institucion" />
          </label>
          <label>
            Provincia
            <input formControlName="provincia" />
          </label>
          <label class="checkbox-inline">
            <input type="checkbox" formControlName="requiereFactura" />
            Requiere factura
          </label>
          @if (requiereCertificado) {
            <label>
              Certificado de categoría (PDF/JPG)
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="onCertificado($event)" />
            </label>
          }
          <div class="actions">
            <button type="submit" [disabled]="form.invalid || guardando || faltaCertificado">
              Enviar inscripción
            </button>
          </div>
        </form>
      }

      @if (cargando) {
        <p>Cargando...</p>
      }

      <p><a routerLink="/participante">← Menú participante</a></p>
    </section>
  `,
})
export class InscripcionParticipanteComponent implements OnInit {
  private fb = inject(FormBuilder);

  categorias = [...CATEGORIAS_INSCRIPCION];
  inscripcion?: InscripcionCongreso;
  mostrarFormulario = true;
  certificado?: File;
  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';

  form = this.fb.group({
    categoria: [this.categorias[0].value, Validators.required],
    institucion: ['', Validators.required],
    provincia: ['', Validators.required],
    requiereFactura: [false],
  });

  constructor(private inscripcionService: InscripcionService) {}

  get requiereCertificado(): boolean {
    const cat = this.form.get('categoria')?.value;
    return cat ? categoriaRequiereCertificado(cat) : false;
  }

  get faltaCertificado(): boolean {
    return this.requiereCertificado && !this.certificado;
  }

  etiqueta(categoria: string): string {
    return etiquetaCategoria(categoria);
  }

  ngOnInit(): void {
    this.cargar();
  }

  onCertificado(event: Event): void {
    this.certificado = (event.target as HTMLInputElement).files?.[0];
  }

  reiniciarFormulario(): void {
    this.mostrarFormulario = true;
    this.inscripcion = undefined;
    this.certificado = undefined;
    this.form.reset({
      categoria: this.categorias[0].value,
      requiereFactura: false,
    });
  }

  enviar(): void {
    if (this.form.invalid || this.faltaCertificado) {
      return;
    }
    const raw = this.form.getRawValue();
    this.guardando = true;
    this.error = '';
    this.inscripcionService
      .crear({
        categoria: raw.categoria!,
        institucion: raw.institucion!,
        provincia: raw.provincia!,
        requiereFactura: !!raw.requiereFactura,
        certificado: this.certificado,
      })
      .subscribe({
        next: (creada) => {
          this.inscripcion = creada;
          this.mostrarFormulario = false;
          this.mensaje = 'Inscripción enviada. Podés registrar el pago cuando quieras.';
          this.guardando = false;
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo enviar la inscripción.');
          this.guardando = false;
        },
      });
  }

  private cargar(): void {
    this.inscripcionService.misDatos().subscribe({
      next: (data) => {
        this.inscripcion = data;
        this.mostrarFormulario = false;
        this.cargando = false;
      },
      error: () => {
        this.mostrarFormulario = true;
        this.cargando = false;
      },
    });
  }
}
