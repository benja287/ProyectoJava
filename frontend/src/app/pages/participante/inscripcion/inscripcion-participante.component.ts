import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { LoginService } from '../../../auth/login.service';
import { ArancelesConfig } from '../../../models/aranceles.model';
import { arancelDeCategoria } from '../../../models/aranceles.model';
import {
  CATEGORIAS_INSCRIPCION,
  CategoriaInscripcion,
  InscripcionCongreso,
  PROVINCIAS,
  asCategoriaInscripcion,
  categoriaRequiereCertificado,
  etiquetaCategoria,
} from '../../../models/inscripcion.model';
import { ArancelesService } from '../../../servicios/aranceles.service';
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
              @if (inscripcion.pagoMonto != null) {
                <dt>Monto</dt>
                <dd>{{ inscripcion.pagoMonto }}</dd>
              }
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
            <p>Completá tus datos y la forma de pago según lo configurado por la organización.</p>
          </div>

          @if (error) {
            <p class="error">{{ error }}</p>
          }

          <div class="categoria-box">
            <label>Tu categoría de inscripción</label>
            @if (categoriaBloqueada) {
              <p class="categoria-fija">
                {{ etiqueta(categoriaActual) }}
                <small>Definida en tu registro de usuario.</small>
              </p>
            } @else {
              <select [formControl]="categoriaCtrl">
                @for (c of categorias; track c.value) {
                  <option [value]="c.value">{{ c.label }}</option>
                }
              </select>
            }
          </div>

          @if (!arancelesListos) {
            <div class="aviso-amarillo">
              <p>
                {{
                  arancelesConfig?.motivoBloqueo ||
                    'Los aranceles y los datos de pago todavía no están disponibles. Cuando el admin los publique vas a ver el precio de tu categoría y cómo transferir.'
                }}
              </p>
              <p class="muted" style="margin-top: 0.5rem">
                Mientras tanto no podés subir comprobante ni enviar la inscripción.
              </p>
            </div>
          } @else {
            @if (arancel) {
              <div class="arancel-info">
                Arancel para tu categoría: <strong>{{ arancel.etiqueta }}</strong>
              </div>
            }

            <div class="pago-datos notice-box">
              <h3>Datos para transferir</h3>
              @if (arancelesConfig?.aliasPago) {
                <p>
                  Alias / CBU:
                  <strong>{{ arancelesConfig!.aliasPago }}</strong>
                </p>
              }
              @if (arancelesConfig?.qrPagoUrl) {
                <p>
                  <app-archivo-link [url]="arancelesConfig!.qrPagoUrl" label="Ver QR de pago" />
                </p>
              }
              @if (arancelesConfig?.instruccionesPago) {
                <p class="muted">{{ arancelesConfig!.instruccionesPago }}</p>
              }
            </div>

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
                  Pago en efectivo: la inscripción queda pendiente hasta que un administrador
                  confirme el cobro.
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

              @if (requiereCertificado) {
                <label class="upload-box">
                  Certificado de categoría (obligatorio)
                  <small>No es el comprobante de pago</small>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    (change)="onCertificado($event)"
                  />
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
  arancelesConfig: ArancelesConfig | null = null;

  categoriaCtrl = this.fb.nonNullable.control(this.categorias[0].value, Validators.required);

  form = this.fb.group({
    metodoPago: ['TRANSFERENCIA', Validators.required],
    requiereFactura: [false],
    institucion: ['', Validators.required],
    provincia: ['', Validators.required],
  });

  constructor(
    private inscripcionService: InscripcionService,
    private arancelesService: ArancelesService,
    private loginService: LoginService,
    private router: Router
  ) {}

  get categoriaActual(): string {
    return this.categoriaCtrl.value ?? '';
  }

  get arancelesListos(): boolean {
    return !!this.arancelesConfig?.puedeInscribirseAhora;
  }

  get arancel() {
    return arancelDeCategoria(this.arancelesConfig, this.categoriaActual);
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
    if (this.loginService.hasRole('ASISTENTE')) {
      this.router.navigateByUrl('/asistente');
      return;
    }
    const catUsuario = asCategoriaInscripcion(
      this.loginService.getUser()?.categoriaInscripcion
    );
    if (catUsuario) {
      this.categoriaCtrl.setValue(catUsuario);
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
      institucion: '',
      provincia: '',
    });
    if (this.categoriaPreferida) {
      this.categoriaCtrl.setValue(this.categoriaPreferida);
    }
  }

  enviar(): void {
    if (!this.arancelesListos || this.form.invalid || this.faltaArchivos) {
      return;
    }
    const raw = this.form.getRawValue();
    this.guardando = true;
    this.error = '';
    this.inscripcionService
      .crear({
        categoria: this.categoriaActual,
        institucion: raw.institucion!,
        provincia: raw.provincia!,
        requiereFactura: !!raw.requiereFactura,
        metodoPago: raw.metodoPago as 'TRANSFERENCIA' | 'EFECTIVO',
        // El backend fija el monto oficial; se envía el publicado por UX.
        monto: this.arancel?.monto ?? 0,
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
        if (catPreferida) {
          this.categoriaCtrl.setValue(catPreferida);
          this.categoriaBloqueada = true;
        }
        this.mostrarFormulario = estado.puedeInscribirse;
        this.loginService.sincronizarTrasEstadoCongreso(estado).subscribe({
          next: () => {
            if (this.loginService.esAsistenteCongreso()) {
              this.router.navigateByUrl('/asistente');
            }
          },
        });
        this.cargarAranceles();
      },
      error: () => {
        this.mostrarFormulario = true;
        this.cargarAranceles();
      },
    });
  }

  private cargarAranceles(): void {
    this.arancelesService.obtener().subscribe({
      next: (cfg) => {
        this.arancelesConfig = cfg;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar los aranceles.');
        this.cargando = false;
      },
    });
  }
}
