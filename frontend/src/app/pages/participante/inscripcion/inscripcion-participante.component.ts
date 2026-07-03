import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { LoginService } from '../../../auth/login.service';
import {
  ARANCELES_CATEGORIA,
  CATEGORIAS_INSCRIPCION,
  CategoriaInscripcion,
  InscripcionCongreso,
  PROVINCIAS,
  arancelCategoria,
  asCategoriaInscripcion,
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
    <div class="inscripcion-page">
      <div class="inscripcion-card">
        @if (enviado) {
          <div class="inscripcion-success">
            <h2>Tu inscripción fue enviada</h2>
            <p>Será validada por el equipo organizador.</p>
            <a routerLink="/" class="btn-primary-full">Volver al inicio</a>
          </div>
        } @else if (inscripcion && !mostrarFormulario) {
          <div class="inscripcion-success">
            @if (inscripcion.estado === 'APROBADA') {
              <h2>¡Tu inscripción fue aprobada!</h2>
              <p>Ya estás inscripto/a al congreso.</p>
            } @else if (inscripcion.estado === 'PENDIENTE') {
              <h2>Tu inscripción está pendiente</h2>
              <p>
                @if (metodoEfectivo) {
                  Declaraste pago en efectivo. La organización validará el cobro presencial.
                } @else {
                  Enviaste comprobante de transferencia. Será validado por administración.
                }
              </p>
            } @else {
              <h2>Inscripción rechazada</h2>
              @if (inscripcion.motivoRechazo) {
                <p>Motivo: {{ inscripcion.motivoRechazo }}</p>
              }
            }

            <dl class="detalle">
              <dt>Categoría</dt>
              <dd>{{ etiqueta(inscripcion.categoria) }}</dd>
              <dt>Estado pago</dt>
              <dd>{{ inscripcion.pagoEstado || '—' }}</dd>
              @if (inscripcion.pagoComprobanteUrl) {
                <dt>Comprobante</dt>
                <dd>
                  <app-archivo-link [url]="inscripcion.pagoComprobanteUrl" label="Ver comprobante" />
                </dd>
              }
            </dl>

            @if (inscripcion.estado === 'RECHAZADA') {
              <button type="button" class="btn-primary-full" (click)="reiniciarFormulario()">
                Enviar nueva inscripción
              </button>
            } @else {
              <a routerLink="/" class="btn-primary-full">Volver al inicio</a>
            }
          </div>
        } @else {
          <div class="inscripcion-header">
            <h1>Inscripción al Congreso</h1>
            <p>
              Completá tus datos, elegí la forma de pago y adjuntá los archivos que correspondan.
            </p>
          </div>

          @if (error) {
            <p class="error">{{ error }}</p>
          }

          <form [formGroup]="form" (ngSubmit)="enviar()" class="inscripcion-form">
            <fieldset class="inscripcion-fieldset">
              <legend>Forma de pago</legend>
              <label class="radio-card">
                <input type="radio" formControlName="metodoPago" value="TRANSFERENCIA" />
                <span>
                  <strong>Transferencia u otro pago con comprobante</strong>
                  <small>Adjuntá captura, PDF o imagen del comprobante.</small>
                </span>
              </label>
              <label class="radio-card">
                <input type="radio" formControlName="metodoPago" value="EFECTIVO" />
                <span>
                  <strong>Efectivo / inscripción presencial</strong>
                  <small>Sin comprobante digital. Validación en caja o acreditación.</small>
                </span>
              </label>
              <label class="checkbox-inline">
                <input type="checkbox" formControlName="requiereFactura" />
                Solicito factura (fiscal)
              </label>
            </fieldset>

            @if (form.get('metodoPago')?.value === 'TRANSFERENCIA') {
              <label class="upload-box">
                Comprobante de pago (obligatorio)
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="onComprobante($event)" />
                @if (comprobante) {
                  <span class="ok">Archivo: {{ comprobante.name }}</span>
                }
              </label>
            } @else {
              <p class="notice-box">
                Pago en efectivo: la inscripción queda pendiente hasta que un administrador confirme el cobro.
              </p>
            }

            <label>
              Institución
              <input formControlName="institucion" />
            </label>

            <label>
              Provincia
              <select formControlName="provincia">
                <option value="">Seleccioná</option>
                @for (p of provincias; track p) {
                  <option [value]="p">{{ p }}</option>
                }
              </select>
            </label>

            <div class="categoria-box">
              <label>Categoría de inscripción</label>
              @if (categoriaBloqueada) {
                <p class="categoria-fija">
                  {{ etiqueta(categoriaActual) }}
                  <small>Definida en tu registro de usuario.</small>
                </p>
              } @else {
                <select formControlName="categoria">
                  @for (c of categorias; track c.value) {
                    <option [value]="c.value">{{ c.label }}</option>
                  }
                </select>
              }
              @if (arancel) {
                <div class="arancel-info">
                  Arancel para tu categoría: <strong>{{ arancel.etiqueta }}</strong>
                  <small>{{ arancel.linkLabel }}</small>
                </div>
              }
            </div>

            @if (requiereCertificado) {
              <label class="upload-box">
                Certificado de categoría (obligatorio)
                <small>No es el comprobante de pago</small>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="onCertificado($event)" />
                @if (certificado) {
                  <span class="ok">Certificado: {{ certificado.name }}</span>
                }
              </label>
            }

            <button
              type="submit"
              class="btn-primary-full"
              [disabled]="form.invalid || guardando || faltaArchivos"
            >
              {{ guardando ? 'Enviando...' : 'Enviar inscripción' }}
            </button>
          </form>
        }

        @if (cargando) {
          <p>Cargando...</p>
        }

        <p class="inscripcion-back"><a routerLink="/">← Volver al inicio</a></p>
      </div>
    </div>
  `,
})
export class InscripcionParticipanteComponent implements OnInit {
  private fb = inject(FormBuilder);

  categorias = [...CATEGORIAS_INSCRIPCION];
  provincias = [...PROVINCIAS];
  inscripcion?: InscripcionCongreso;
  categoriaPreferida?: CategoriaInscripcion | null;
  categoriaBloqueada = false;
  mostrarFormulario = true;
  enviado = false;
  certificado?: File;
  comprobante?: File;
  cargando = true;
  guardando = false;
  error = '';

  form = this.fb.group({
    metodoPago: ['TRANSFERENCIA', Validators.required],
    requiereFactura: [false],
    institucion: ['', Validators.required],
    provincia: ['', Validators.required],
    categoria: [this.categorias[0].value, Validators.required],
  });

  constructor(
    private inscripcionService: InscripcionService,
    private loginService: LoginService
  ) {}

  get categoriaActual(): string {
    return this.form.get('categoria')?.value ?? '';
  }

  get arancel() {
    return arancelCategoria(this.categoriaActual);
  }

  get requiereCertificado(): boolean {
    return categoriaRequiereCertificado(this.categoriaActual);
  }

  get faltaArchivos(): boolean {
    const transfer = this.form.get('metodoPago')?.value === 'TRANSFERENCIA';
    if (transfer && !this.comprobante) {
      return true;
    }
    return this.requiereCertificado && !this.certificado;
  }

  get metodoEfectivo(): boolean {
    return this.inscripcion?.pagoEstado != null && !this.inscripcion?.pagoComprobanteUrl;
  }

  etiqueta(categoria: string): string {
    return etiquetaCategoria(categoria);
  }

  ngOnInit(): void {
    const catUsuario = asCategoriaInscripcion(
      this.loginService.getUser()?.categoriaInscripcion
    );
    if (catUsuario) {
      this.form.patchValue({ categoria: catUsuario });
      this.categoriaPreferida = catUsuario;
      this.categoriaBloqueada = true;
    }
    this.cargar();
  }

  onCertificado(event: Event): void {
    this.certificado = (event.target as HTMLInputElement).files?.[0];
  }

  onComprobante(event: Event): void {
    this.comprobante = (event.target as HTMLInputElement).files?.[0];
  }

  reiniciarFormulario(): void {
    this.mostrarFormulario = true;
    this.inscripcion = undefined;
    this.enviado = false;
    this.certificado = undefined;
    this.comprobante = undefined;
    this.form.reset({
      metodoPago: 'TRANSFERENCIA',
      requiereFactura: false,
      categoria: this.categoriaPreferida || this.categorias[0].value,
      institucion: '',
      provincia: '',
    });
  }

  enviar(): void {
    if (this.form.invalid || this.faltaArchivos) {
      return;
    }
    const raw = this.form.getRawValue();
    const arancelCat = ARANCELES_CATEGORIA[raw.categoria as keyof typeof ARANCELES_CATEGORIA];
    this.guardando = true;
    this.error = '';
    this.inscripcionService
      .crear({
        categoria: raw.categoria!,
        institucion: raw.institucion!,
        provincia: raw.provincia!,
        requiereFactura: !!raw.requiereFactura,
        metodoPago: raw.metodoPago as 'TRANSFERENCIA' | 'EFECTIVO',
        monto: arancelCat?.monto ?? 0,
        certificado: this.certificado,
        comprobante: raw.metodoPago === 'TRANSFERENCIA' ? this.comprobante : undefined,
      })
      .subscribe({
        next: (creada) => {
          this.inscripcion = creada;
          this.mostrarFormulario = false;
          this.enviado = true;
          this.guardando = false;
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo enviar la inscripción.');
          this.guardando = false;
        },
      });
  }

  private cargar(): void {
    this.inscripcionService.misEstado().subscribe({
      next: (estado) => {
        this.inscripcion = estado.inscripcion ?? undefined;
        const catPreferida = asCategoriaInscripcion(estado.categoriaPreferida);
        this.categoriaPreferida = catPreferida ?? this.categoriaPreferida;
        if (catPreferida && !this.categoriaBloqueada) {
          this.form.patchValue({ categoria: catPreferida });
          this.categoriaBloqueada = true;
        }
        this.mostrarFormulario = estado.puedeInscribirse;
        this.cargando = false;
      },
      error: () => {
        this.mostrarFormulario = true;
        this.cargando = false;
      },
    });
  }
}
