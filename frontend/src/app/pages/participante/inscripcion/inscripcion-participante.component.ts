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
  CONDICIONES_IVA,
  CategoriaInscripcion,
  InscripcionCongreso,
  PROVINCIAS,
  ReglasCategoria,
  TIPOS_IDENTIFICACION_INSCRIPCION,
  TIPOS_PARTICIPACION,
  asCategoriaInscripcion,
  esPagoEfectivo,
  etiquetaCategoria,
  etiquetaMetodoPago,
  etiquetaTipoParticipacion,
} from '../../../models/inscripcion.model';
import { ArancelesService } from '../../../servicios/aranceles.service';
import { InscripcionService } from '../../../servicios/inscripcion.service';
import { UsuarioService } from '../../../servicios/usuario.service';
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
            @if (enviadoEfectivo) {
              <h2>Pago en efectivo — sin comprobante digital</h2>
              <p>
                La inscripción queda pendiente hasta que un administrador valide el cobro en
                efectivo.
              </p>
            } @else {
              <h2>Tu inscripción fue enviada</h2>
              <p>Enviaste el comprobante. Será validado por el equipo organizador.</p>
            }
            <a routerLink="/" class="btn-primary-full">Volver al inicio</a>
          </div>
        } @else if (inscripcion && !mostrarFormulario) {
          <div class="inscripcion-success">
            @if (inscripcion.estado === 'APROBADA') {
              <h2>¡Tu inscripción fue aprobada!</h2>
              <p>Ya estás inscripto/a al congreso como asistente.</p>
            } @else if (inscripcion.estado === 'PENDIENTE') {
              <h2>Tu inscripción está pendiente</h2>
              <p>Administración revisará tus datos y el pago.</p>
            } @else {
              <h2>Inscripción rechazada</h2>
              @if (inscripcion.motivoRechazo) {
                <p>Motivo: {{ inscripcion.motivoRechazo }}</p>
              }
            }

            <dl class="detalle">
              <dt>Categoría</dt>
              <dd>{{ etiqueta(inscripcion.categoria) }}</dd>
              <dt>Participación</dt>
              <dd>{{ resumenParticipacion(inscripcion) }}</dd>
              <dt>Forma de pago</dt>
              <dd>{{ etiquetaMetodo(inscripcion.pagoMetodo) }}</dd>
              <dt>Estado pago</dt>
              <dd>{{ inscripcion.pagoEstado || '—' }}</dd>
              @if (inscripcion.requiereFactura) {
                <dt>Factura</dt>
                <dd>
                  {{ inscripcion.facturaRazonSocial }} · CUIT {{ inscripcion.facturaCuit }}
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
            <p>Completá el asistente paso a paso. Tus datos de certificado vienen del registro.</p>
          </div>

          <ol class="wizard-steps">
            @for (s of pasos; track s; let i = $index) {
              <li [class.active]="paso === i + 1" [class.done]="paso > i + 1">
                <span>{{ i + 1 }}</span> {{ s }}
              </li>
            }
          </ol>

          @if (error) {
            <p class="error">{{ error }}</p>
          }

          @if (!arancelesListos && paso >= 2) {
            <div class="aviso-amarillo">
              <p>
                {{
                  arancelesConfig?.motivoBloqueo ||
                    'Los aranceles todavía no están publicados. No podés enviar la inscripción aún.'
                }}
              </p>
            </div>
          }

          <form [formGroup]="form" class="inscripcion-form">
            @if (paso === 1) {
              <fieldset class="inscripcion-fieldset">
                <legend>1. Datos para el certificado</legend>
                <p class="form-hint">
                  Declaro que la información es verdadera y autorizo su uso para certificados e
                  inscripción al congreso.
                </p>
                <label>
                  Nombre
                  <input formControlName="nombre" />
                </label>
                <label>
                  Apellido
                  <input formControlName="apellido" />
                </label>
                <label>
                  Email
                  <input formControlName="email" type="email" />
                </label>
                <label>
                  Teléfono (internacional)
                  <input formControlName="telefono" placeholder="+54 9 221..." />
                </label>
                <label>
                  Tipo de identificación
                  <select formControlName="tipoIdentificacion">
                    @for (t of tiposId; track t.value) {
                      <option [value]="t.value">{{ t.label }}</option>
                    }
                  </select>
                </label>
                <label>
                  Número de identificación
                  <input formControlName="numeroIdentificacion" />
                </label>
                <label>
                  Nacionalidad
                  <input formControlName="nacionalidad" />
                </label>
              </fieldset>
            }

            @if (paso === 2) {
              <fieldset class="inscripcion-fieldset">
                <legend>2. Categoría e institución</legend>
                <div class="categoria-box">
                  <label>Categoría de inscripción</label>
                  @if (categoriaBloqueada) {
                    <p class="categoria-fija">
                      {{ etiqueta(categoriaActual) }}
                      <small>Definida en tu registro.</small>
                    </p>
                  } @else {
                    <select [formControl]="categoriaCtrl">
                      @for (c of categorias; track c.value) {
                        <option [value]="c.value">{{ c.label }}</option>
                      }
                    </select>
                  }
                </div>
                @if (reglasActuales) {
                  <p class="notice-box">{{ reglasActuales.ayuda }}</p>
                }
                @if (arancel) {
                  <div class="arancel-info">
                    Arancel: <strong>{{ arancel.etiqueta }}</strong>
                  </div>
                }
                <label>
                  Institución / filiación
                  <input formControlName="institucion" />
                  @if (reglasActuales?.destacaFiliacionInstitucional) {
                    <span class="form-hint">Obligatoria para no socio/extranjero.</span>
                  }
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
                      <span class="ok">{{ certificado.name }}</span>
                    }
                  </label>
                }
              </fieldset>
            }

            @if (paso === 3) {
              <fieldset class="inscripcion-fieldset">
                <legend>3. Tipo de participación</legend>
                <p class="form-hint">
                  Declaración inicial para logística. Luego podés completar trabajos/talleres en los
                  módulos correspondientes.
                </p>
                @for (t of tiposParticipacionOpts; track t.value) {
                  <label class="checkbox-inline">
                    <input
                      type="checkbox"
                      [checked]="tiposParticipacionSeleccionados.includes(t.value)"
                      (change)="toggleParticipacion(t.value, $event)"
                    />
                    {{ t.label }}
                  </label>
                }
                @if (tiposParticipacionSeleccionados.includes('OTRO')) {
                  <label>
                    Detalle de «Otro»
                    <input formControlName="participacionOtro" />
                  </label>
                }
              </fieldset>
            }

            @if (paso === 4) {
              <fieldset class="inscripcion-fieldset">
                <legend>4. Pago y factura</legend>
                @if (arancelesConfig?.aliasPago || arancelesConfig?.qrPagoUrl) {
                  <div class="pago-datos notice-box">
                    <h3>Datos para transferir</h3>
                    @if (arancelesConfig?.aliasPago) {
                      <p>
                        Alias / CBU: <strong>{{ arancelesConfig!.aliasPago }}</strong>
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
                }
                <label class="radio-card">
                  <input type="radio" formControlName="metodoPago" value="TRANSFERENCIA" />
                  <span>
                    <strong>Transferencia (con comprobante)</strong>
                    <small>PDF/JPG/PNG. Debe incluir n.º de transacción.</small>
                  </span>
                </label>
                <label class="radio-card">
                  <input type="radio" formControlName="metodoPago" value="EFECTIVO" />
                  <span>
                    <strong>Efectivo / presencial</strong>
                    <small>Sin comprobante digital.</small>
                  </span>
                </label>
                @if (form.get('metodoPago')?.value === 'TRANSFERENCIA') {
                  <label class="upload-box">
                    Comprobante de pago (obligatorio)
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      (change)="onComprobante($event)"
                    />
                    @if (comprobante) {
                      <span class="ok">{{ comprobante.name }}</span>
                    }
                  </label>
                }
                <label class="checkbox-inline">
                  <input type="checkbox" formControlName="requiereFactura" />
                  Solicito factura (avisá con 48 hs de anticipación por email si hace falta)
                </label>
                @if (form.get('requiereFactura')?.value) {
                  <label>
                    Razón social
                    <input formControlName="facturaRazonSocial" />
                  </label>
                  <label>
                    CUIT / CUIL
                    <input formControlName="facturaCuit" />
                  </label>
                  <label>
                    Condición frente al IVA
                    <select formControlName="facturaCondicionIva">
                      <option value="">Seleccioná</option>
                      @for (c of condicionesIva; track c.value) {
                        <option [value]="c.value">{{ c.label }}</option>
                      }
                    </select>
                  </label>
                  <label>
                    Domicilio fiscal
                    <input formControlName="facturaDomicilioFiscal" />
                  </label>
                }
              </fieldset>
            }

            @if (paso === 5) {
              <fieldset class="inscripcion-fieldset">
                <legend>5. Confirmación</legend>
                <dl class="detalle">
                  <dt>Certificado</dt>
                  <dd>
                    {{ form.value.apellido }}, {{ form.value.nombre }} · {{ form.value.email }}
                    <br />
                    {{ form.value.tipoIdentificacion }} {{ form.value.numeroIdentificacion }} ·
                    {{ form.value.nacionalidad }} · {{ form.value.telefono }}
                  </dd>
                  <dt>Categoría</dt>
                  <dd>{{ etiqueta(categoriaActual) }} @if (arancel) { — {{ arancel.etiqueta }} }</dd>
                  <dt>Institución</dt>
                  <dd>{{ form.value.institucion }} · {{ form.value.provincia }}</dd>
                  <dt>Participación</dt>
                  <dd>
                    {{
                      tiposParticipacionSeleccionados
                        .map(etiquetaTipoParticipacion)
                        .join(', ')
                    }}
                    @if (form.value.participacionOtro) {
                      ({{ form.value.participacionOtro }})
                    }
                  </dd>
                  <dt>Pago</dt>
                  <dd>{{ etiquetaMetodo(form.value.metodoPago) }}</dd>
                  <dt>Factura</dt>
                  <dd>
                    {{
                      form.value.requiereFactura
                        ? form.value.facturaRazonSocial + ' / ' + form.value.facturaCuit
                        : 'No'
                    }}
                  </dd>
                </dl>
              </fieldset>
            }

            <div class="wizard-nav">
              @if (paso > 1) {
                <button type="button" class="btn-secundario" (click)="pasoAnterior()">
                  Atrás
                </button>
              }
              @if (paso < 5) {
                <button
                  type="button"
                  class="btn-primary-full"
                  (click)="pasoSiguiente()"
                  [disabled]="!puedeAvanzarPaso"
                >
                  Siguiente
                </button>
              } @else {
                <button
                  type="button"
                  class="btn-primary-full"
                  (click)="enviar()"
                  [disabled]="!puedeEnviar || guardando"
                >
                  {{ guardando ? 'Enviando...' : 'Confirmar e inscribirme' }}
                </button>
              }
            </div>
          </form>
        }

        @if (cargando) {
          <p>Cargando...</p>
        }

        <p class="inscripcion-back"><a routerLink="/">← Volver al inicio</a></p>
      </div>
    </div>
  `,
  styles: [
    `
      .wizard-steps {
        list-style: none;
        padding: 0;
        margin: 0 0 1.25rem;
        display: grid;
        gap: 0.35rem;
      }
      .wizard-steps li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #64748b;
        font-size: 0.9rem;
      }
      .wizard-steps li span {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 999px;
        border: 1px solid #cbd5e1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
      }
      .wizard-steps li.active {
        color: #0f172a;
        font-weight: 600;
      }
      .wizard-steps li.active span {
        background: #2d5016;
        border-color: #2d5016;
        color: #fff;
      }
      .wizard-steps li.done span {
        background: #dcfce7;
        border-color: #86efac;
      }
      .wizard-nav {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
        flex-wrap: wrap;
      }
      .wizard-nav .btn-primary-full {
        flex: 1;
        min-width: 10rem;
      }
      .form-hint {
        display: block;
        margin: 0.25rem 0 0.75rem;
        font-size: 0.85rem;
        color: #64748b;
      }
    `,
  ],
})
export class InscripcionParticipanteComponent implements OnInit {
  private fb = inject(FormBuilder);

  pasos = [
    'Datos certificado',
    'Categoría',
    'Participación',
    'Pago / factura',
    'Confirmación',
  ];
  paso = 1;

  categorias = [...CATEGORIAS_INSCRIPCION];
  provincias = [...PROVINCIAS];
  tiposId = [...TIPOS_IDENTIFICACION_INSCRIPCION];
  tiposParticipacionOpts = [...TIPOS_PARTICIPACION];
  condicionesIva = [...CONDICIONES_IVA];
  tiposParticipacionSeleccionados: string[] = ['ASISTENTE'];
  reglasPorCategoria: ReglasCategoria[] = [];

  inscripcion?: InscripcionCongreso;
  categoriaPreferida?: CategoriaInscripcion | null;
  categoriaBloqueada = false;
  mostrarFormulario = true;
  enviado = false;
  enviadoEfectivo = false;
  certificado?: File;
  comprobante?: File;
  cargando = true;
  guardando = false;
  error = '';
  arancelesConfig: ArancelesConfig | null = null;

  categoriaCtrl = this.fb.nonNullable.control(this.categorias[0].value, Validators.required);

  form = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.minLength(6)]],
    tipoIdentificacion: ['DNI', Validators.required],
    numeroIdentificacion: ['', Validators.required],
    nacionalidad: ['Argentina', Validators.required],
    metodoPago: ['TRANSFERENCIA', Validators.required],
    requiereFactura: [false],
    facturaRazonSocial: [''],
    facturaCuit: [''],
    facturaCondicionIva: [''],
    facturaDomicilioFiscal: [''],
    institucion: ['', Validators.required],
    provincia: ['', Validators.required],
    participacionOtro: [''],
  });

  constructor(
    private inscripcionService: InscripcionService,
    private arancelesService: ArancelesService,
    private usuarioService: UsuarioService,
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

  get reglasActuales(): ReglasCategoria | undefined {
    return this.reglasPorCategoria.find((r) => r.categoria === this.categoriaActual);
  }

  get requiereCertificado(): boolean {
    return this.reglasActuales?.requiereCertificado ?? false;
  }

  get puedeAvanzarPaso(): boolean {
    if (this.paso === 1) {
      return !!(
        this.form.get('nombre')?.valid &&
        this.form.get('apellido')?.valid &&
        this.form.get('email')?.valid &&
        this.form.get('telefono')?.valid &&
        this.form.get('tipoIdentificacion')?.valid &&
        this.form.get('numeroIdentificacion')?.valid &&
        this.form.get('nacionalidad')?.valid
      );
    }
    if (this.paso === 2) {
      const okInst =
        !!this.form.get('institucion')?.value?.toString().trim() &&
        !!this.form.get('provincia')?.value;
      const okCert = !this.requiereCertificado || !!this.certificado;
      return okInst && okCert;
    }
    if (this.paso === 3) {
      if (this.tiposParticipacionSeleccionados.length === 0) return false;
      if (
        this.tiposParticipacionSeleccionados.includes('OTRO') &&
        !this.form.get('participacionOtro')?.value?.toString().trim()
      ) {
        return false;
      }
      return true;
    }
    if (this.paso === 4) {
      const transfer = this.form.get('metodoPago')?.value === 'TRANSFERENCIA';
      if (transfer && !this.comprobante) return false;
      if (this.form.get('requiereFactura')?.value) {
        return !!(
          this.form.get('facturaRazonSocial')?.value?.toString().trim() &&
          this.form.get('facturaCuit')?.value?.toString().trim() &&
          this.form.get('facturaCondicionIva')?.value &&
          this.form.get('facturaDomicilioFiscal')?.value?.toString().trim()
        );
      }
      return true;
    }
    return true;
  }

  get puedeEnviar(): boolean {
    return this.arancelesListos && this.puedeAvanzarPaso && this.paso === 5;
  }

  etiqueta(categoria: string): string {
    return etiquetaCategoria(categoria);
  }

  etiquetaMetodo(metodo?: string | null): string {
    return etiquetaMetodoPago(metodo);
  }

  readonly etiquetaTipoParticipacion = etiquetaTipoParticipacion;

  resumenParticipacion(i: InscripcionCongreso): string {
    const tipos = (i.tiposParticipacion || []).map(etiquetaTipoParticipacion).join(', ');
    if (i.participacionOtro) {
      return `${tipos} (${i.participacionOtro})`;
    }
    return tipos || '—';
  }

  ngOnInit(): void {
    if (this.loginService.hasRole('ASISTENTE')) {
      this.router.navigateByUrl('/asistente');
      return;
    }
    const u = this.loginService.getUser();
    const catUsuario = asCategoriaInscripcion(u?.categoriaInscripcion);
    if (catUsuario) {
      this.categoriaCtrl.setValue(catUsuario);
      this.categoriaPreferida = catUsuario;
      this.categoriaBloqueada = true;
    }
    this.prefiliarDesdeUsuario(u);
    this.categoriaCtrl.valueChanges.subscribe(() => this.error = '');
    this.form.get('requiereFactura')?.valueChanges.subscribe((v) => this.toggleFacturaValidators(!!v));
    this.inscripcionService.reglasCategorias().subscribe({
      next: (r) => (this.reglasPorCategoria = r),
      error: () => {
        this.reglasPorCategoria = CATEGORIAS_INSCRIPCION.map((c) => ({
          categoria: c.value,
          requiereCertificado: c.requiereCertificado,
          requierePago: true,
          requiereInstitucion: true,
          requiereComprobanteSiTransferencia: true,
          destacaFiliacionInstitucional: c.value === 'NO_SOCIO' || c.value === 'EXTRANJERO',
          ayuda: '',
        }));
      },
    });
    this.cargar();
  }

  private prefiliarDesdeUsuario(u: ReturnType<LoginService['getUser']>): void {
    if (!u) return;
    this.form.patchValue({
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      email: u.email || '',
      telefono: u.telefono || '',
      tipoIdentificacion: u.tipoIdentificacion || 'DNI',
      numeroIdentificacion: u.numeroIdentificacion || '',
      nacionalidad: u.nacionalidad || 'Argentina',
    });
  }

  private toggleFacturaValidators(activo: boolean): void {
    const fields = [
      'facturaRazonSocial',
      'facturaCuit',
      'facturaCondicionIva',
      'facturaDomicilioFiscal',
    ] as const;
    for (const f of fields) {
      const ctrl = this.form.get(f);
      if (!ctrl) continue;
      if (activo) {
        ctrl.setValidators([Validators.required]);
      } else {
        ctrl.clearValidators();
        ctrl.setValue('');
      }
      ctrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  pasoSiguiente(): void {
    this.error = '';
    if (!this.puedeAvanzarPaso) {
      this.error = 'Completá los campos obligatorios de este paso.';
      return;
    }
    this.paso = Math.min(5, this.paso + 1);
  }

  pasoAnterior(): void {
    this.error = '';
    this.paso = Math.max(1, this.paso - 1);
  }

  toggleParticipacion(valor: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.tiposParticipacionSeleccionados = [...this.tiposParticipacionSeleccionados, valor];
    } else {
      this.tiposParticipacionSeleccionados = this.tiposParticipacionSeleccionados.filter(
        (t) => t !== valor
      );
    }
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
    this.enviadoEfectivo = false;
    this.certificado = undefined;
    this.comprobante = undefined;
    this.paso = 1;
    this.tiposParticipacionSeleccionados = ['ASISTENTE'];
    this.form.patchValue({
      metodoPago: 'TRANSFERENCIA',
      requiereFactura: false,
      institucion: '',
      provincia: '',
      participacionOtro: '',
      facturaRazonSocial: '',
      facturaCuit: '',
      facturaCondicionIva: '',
      facturaDomicilioFiscal: '',
    });
    this.toggleFacturaValidators(false);
    if (this.categoriaPreferida) {
      this.categoriaCtrl.setValue(this.categoriaPreferida);
    }
    this.prefiliarDesdeUsuario(this.loginService.getUser());
  }

  enviar(): void {
    if (!this.puedeEnviar) {
      return;
    }
    const raw = this.form.getRawValue();
    this.guardando = true;
    this.error = '';
    this.usuarioService
      .actualizarMiPerfil({
        nombre: raw.nombre!,
        apellido: raw.apellido!,
        email: raw.email!,
        telefono: raw.telefono!,
        tipoIdentificacion: raw.tipoIdentificacion!,
        numeroIdentificacion: raw.numeroIdentificacion!,
        nacionalidad: raw.nacionalidad!,
      })
      .subscribe({
        next: () => this.crearInscripcion(raw),
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudieron guardar los datos del certificado.');
          this.guardando = false;
        },
      });
  }

  private crearInscripcion(raw: ReturnType<typeof this.form.getRawValue>): void {
    this.inscripcionService
      .crear({
        categoria: this.categoriaActual,
        institucion: raw.institucion!,
        provincia: raw.provincia!,
        requiereFactura: !!raw.requiereFactura,
        metodoPago: raw.metodoPago as 'TRANSFERENCIA' | 'EFECTIVO',
        monto: this.arancel?.monto ?? 0,
        tiposParticipacion: this.tiposParticipacionSeleccionados,
        participacionOtro: raw.participacionOtro || undefined,
        facturaRazonSocial: raw.facturaRazonSocial || undefined,
        facturaCuit: raw.facturaCuit || undefined,
        facturaCondicionIva: raw.facturaCondicionIva || undefined,
        facturaDomicilioFiscal: raw.facturaDomicilioFiscal || undefined,
        telefono: raw.telefono || undefined,
        tipoIdentificacion: raw.tipoIdentificacion || undefined,
        numeroIdentificacion: raw.numeroIdentificacion || undefined,
        nacionalidad: raw.nacionalidad || undefined,
        certificado: this.certificado,
        comprobante: raw.metodoPago === 'TRANSFERENCIA' ? this.comprobante : undefined,
      })
      .subscribe({
        next: (creada) => {
          this.inscripcion = creada;
          this.mostrarFormulario = false;
          this.enviado = true;
          this.enviadoEfectivo = raw.metodoPago === 'EFECTIVO';
          this.guardando = false;
          this.loginService.refreshUser().subscribe();
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
            this.prefiliarDesdeUsuario(this.loginService.getUser());
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
