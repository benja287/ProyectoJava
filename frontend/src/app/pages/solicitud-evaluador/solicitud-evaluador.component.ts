import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogosCongresoService } from '../../servicios/catalogos-congreso.service';
import { LoginService } from '../../auth/login.service';
import {
  AREAS_CONOCIMIENTO,
  FORMACIONES_AGROECOLOGIA,
  SolicitudEvaluador,
  SUBAREAS_AGRO,
  SUBAREAS_ANIMAL,
  TIPOS_IDENTIFICACION,
} from '../../models/solicitud-evaluador.model';
import { SolicitudEvaluadorService } from '../../servicios/solicitud-evaluador.service';
import { mensajeErrorApi } from '../../utils/api-error.util';

@Component({
  selector: 'app-solicitud-evaluador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">🧑‍🔬</span>
        <div>
          <h1>Solicitud al comité de evaluadores</h1>
          <p>Postulate para integrar el comité. La aprobación depende del perfil y de los cupos por eje.</p>
        </div>
      </div>

      <p class="panel-volver"><a [routerLink]="loginService.rutaPanel()">← Volver al panel</a></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (cargando) {
        <p class="muted">Cargando...</p>
      } @else if (solicitud) {
        <section class="panel-card">
          <h2>Estado de tu solicitud: {{ solicitud.estado }}</h2>
          <p class="muted small">Enviada: {{ formatFecha(solicitud.fechaSolicitud) }}</p>
          @if (solicitud.estado === 'PENDIENTE') {
            <p class="notice-box">
              Tu postulación está pendiente de revisión del comité académico. También te enviamos la
              invitación al taller de evaluadorxs: anotarse no garantiza recibir un trabajo para
              evaluar (depende de cupos y trabajos por eje).
            </p>
          }
          @if (solicitud.estado === 'APROBADA') {
            <p class="ok">
              Aprobada.
              @if (solicitud.ejeAsignado) {
                {{ solicitud.ejeAsignado }}.
              }
              @if (solicitud.revisadoPorNombre) {
                · Revisó: {{ solicitud.revisadoPorNombre }}
              }
            </p>
            @if ((solicitud.cuposAsignados?.length ?? 0) > 0) {
              <p class="muted">Cupos actuales (restantes / máximo):</p>
              <ul>
                @for (c of solicitud.cuposAsignados!; track c.ejeTematico) {
                  <li>{{ c.ejeTematico }}: {{ c.restantes }}/{{ c.capacidadMax }}</li>
                }
              </ul>
            }
            @if (!tieneRolEvaluador) {
              <p class="notice-box">
                El rol EVALUADOR ya no está en tu cuenta (fue retirado). Podés volver a postularte.
              </p>
              <button type="button" class="btn-primary" (click)="nuevaSolicitud()">
                Enviar nueva solicitud
              </button>
            }
          }
          @if (solicitud.estado === 'RECHAZADA') {
            <p class="error">Motivo: {{ solicitud.motivoRechazo || '—' }}</p>
            <button type="button" class="btn-primary" (click)="nuevaSolicitud()">
              Enviar nueva solicitud
            </button>
          }
          @if (solicitud.estado === 'REVOCADA') {
            <p class="notice-box">
              Tu postulación aprobada fue revocada porque se te retiró el rol de evaluador.
              @if (solicitud.motivoRechazo) {
                <br />{{ solicitud.motivoRechazo }}
              }
            </p>
            <button type="button" class="btn-primary" (click)="nuevaSolicitud()">
              Enviar nueva solicitud
            </button>
          }
          <dl class="detalle">
            <dt>Nombre</dt>
            <dd>{{ solicitud.nombreCompleto }}</dd>
            <dt>Email</dt>
            <dd>{{ solicitud.email }}</dd>
            <dt>Capacidades por eje</dt>
            <dd>
              <ul>
                @for (c of solicitud.capacidades; track c.ejeTematico) {
                  @if (c.capacidad > 0) {
                    <li>{{ c.ejeTematico }}: {{ c.capacidad }}</li>
                  }
                }
              </ul>
            </dd>
          </dl>
        </section>
      } @else {
        <section class="panel-card">
          <p class="muted">
            Fecha límite orientativa del PDF: 15 de agosto. Taller de evaluadorxs entre el 11 y el 15
            de agosto. Evaluación doble ciego según ejes.
          </p>

          <form [formGroup]="form" (ngSubmit)="enviar()" class="auth-form" style="max-width: 46rem">
            <h2>Datos personales</h2>
            <label>Nombre completo <input formControlName="nombreCompleto" /></label>
            <label>Correo <input type="email" formControlName="email" /></label>
            <label>
              Tipo de identificación
              <select formControlName="tipoIdentificacion">
                @for (t of tiposId; track t.value) {
                  <option [value]="t.value">{{ t.label }}</option>
                }
              </select>
            </label>
            <label>Número <input formControlName="numeroIdentificacion" /></label>
            <label>Nacionalidad <input formControlName="nacionalidad" /></label>
            <label>Institución (opcional) <input formControlName="institucion" /></label>

            <h2>Experiencia previa</h2>
            <label class="checkbox-inline">
              <input type="checkbox" formControlName="evaluoEdicionesCongreso" />
              Evalué en ediciones previas de este congreso
            </label>
            <label class="checkbox-inline">
              <input type="checkbox" formControlName="evaluoOtrosCongresos" />
              Evalué en otros congresos
            </label>

            <h2>Formación en agroecología</h2>
            <label>
              Formación
              <select formControlName="formacionAgroecologia">
                @for (f of formaciones; track f.value) {
                  <option [value]="f.value">{{ f.label }}</option>
                }
              </select>
            </label>

            <h2>Áreas de conocimiento</h2>
            <div class="checks-grid">
              @for (a of areas; track a.value) {
                <label class="checkbox-inline">
                  <input
                    type="checkbox"
                    [checked]="areasSel.has(a.value)"
                    (change)="toggleArea(a.value, $any($event.target).checked)"
                  />
                  {{ a.label }}
                </label>
              }
            </div>

            @if (mostrarSubagro) {
              <h3>Sub-áreas (agricultura / sistemas mixtos)</h3>
              <div class="checks-grid">
                @for (s of subagro; track s.value) {
                  <label class="checkbox-inline">
                    <input
                      type="checkbox"
                      [checked]="subareasSel.has(s.value)"
                      (change)="toggleSub(s.value, $any($event.target).checked)"
                    />
                    {{ s.label }}
                  </label>
                }
              </div>
            }
            @if (mostrarSubanimal) {
              <h3>Sub-áreas (ganadería / apicultura / mixtos)</h3>
              <div class="checks-grid">
                @for (s of subanimal; track s.value) {
                  <label class="checkbox-inline">
                    <input
                      type="checkbox"
                      [checked]="subareasSel.has(s.value)"
                      (change)="toggleSub(s.value, $any($event.target).checked)"
                    />
                    {{ s.label }}
                  </label>
                }
              </div>
            }

            <h2>Capacidad por eje temático</h2>
            <p class="muted small">Indicá cuántos trabajos podrías evaluar en cada eje (0 = ninguno).</p>
            @for (eje of ejes; track eje; let i = $index) {
              <label>
                {{ eje }}
                <input
                  type="number"
                  min="0"
                  max="50"
                  [value]="capacidades[i]"
                  (input)="capacidades[i] = +$any($event.target).value || 0"
                />
              </label>
            }

            <h2>Observaciones</h2>
            <label>
              Texto libre
              <textarea formControlName="observaciones" rows="4"></textarea>
            </label>

            <button type="submit" class="btn-primary" [disabled]="form.invalid || guardando || areasSel.size === 0">
              {{ guardando ? 'Enviando...' : 'Enviar solicitud' }}
            </button>
          </form>
        </section>
      }
    </div>
  `,
  styles: [
    `
      .checks-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.35rem 1rem;
        margin-bottom: 1rem;
      }
      textarea {
        width: 100%;
      }
    `,
  ],
})
export class SolicitudEvaluadorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(SolicitudEvaluadorService);
  private readonly catalogos = inject(CatalogosCongresoService);
  readonly loginService = inject(LoginService);

  tiposId = [...TIPOS_IDENTIFICACION];
  formaciones = [...FORMACIONES_AGROECOLOGIA];
  areas = [...AREAS_CONOCIMIENTO];
  subagro = [...SUBAREAS_AGRO];
  subanimal = [...SUBAREAS_ANIMAL];
  ejes: string[] = [];
  capacidades: number[] = this.ejes.map(() => 0);
  areasSel = new Set<string>();
  subareasSel = new Set<string>();

  solicitud: SolicitudEvaluador | null = null;
  mostrarForm = false;
  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';

  get tieneRolEvaluador(): boolean {
    return this.loginService.hasRole('EVALUADOR');
  }

  form = this.fb.nonNullable.group({
    nombreCompleto: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    tipoIdentificacion: ['DNI', Validators.required],
    numeroIdentificacion: ['', Validators.required],
    nacionalidad: ['Argentina', Validators.required],
    institucion: [''],
    evaluoEdicionesCongreso: [false],
    evaluoOtrosCongresos: [false],
    formacionAgroecologia: ['NINGUNA', Validators.required],
    observaciones: [''],
  });

  get mostrarSubagro(): boolean {
    return [...this.areasSel].some((a) =>
      ['AGRICULTURA_INTENSIVA', 'AGRICULTURA_EXTENSIVA', 'AGRICULTURA_URBANA', 'SISTEMAS_MIXTOS'].includes(a)
    );
  }

  get mostrarSubanimal(): boolean {
    return [...this.areasSel].some((a) =>
      ['GANADERIA', 'APICULTURA', 'SISTEMAS_MIXTOS'].includes(a)
    );
  }

  ngOnInit(): void {
    this.catalogos.ejesActivos().subscribe({
      next: (ejes) => {
        this.ejes = ejes.map((e) => e.codigo);
        this.capacidades = this.ejes.map(() => 0);
      },
    });

    const u = this.loginService.getUser();
    if (u) {
      this.form.patchValue({
        nombreCompleto: `${u.nombre ?? ''} ${u.apellido ?? ''}`.trim(),
        email: u.email ?? '',
      });
    }
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.service.mia().subscribe({
      next: (s) => {
        if (this.mostrarForm) {
          this.solicitud = null;
        } else {
          this.solicitud = s;
        }
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar la solicitud.');
        this.cargando = false;
      },
    });
  }

  nuevaSolicitud(): void {
    this.mostrarForm = true;
    this.solicitud = null;
  }

  toggleArea(value: string, checked: boolean): void {
    if (checked) this.areasSel.add(value);
    else this.areasSel.delete(value);
  }

  toggleSub(value: string, checked: boolean): void {
    if (checked) this.subareasSel.add(value);
    else this.subareasSel.delete(value);
  }

  enviar(): void {
    if (this.form.invalid || this.areasSel.size === 0) {
      this.form.markAllAsTouched();
      return;
    }
    const caps = this.ejes.map((eje, i) => ({
      ejeTematico: eje,
      capacidad: Math.max(0, this.capacidades[i] || 0),
    }));
    if (!caps.some((c) => c.capacidad > 0)) {
      this.error = 'Indicá capacidad > 0 en al menos un eje.';
      return;
    }
    const v = this.form.getRawValue();
    this.guardando = true;
    this.error = '';
    this.mensaje = '';
    this.service
      .crear({
        ...v,
        areasConocimiento: [...this.areasSel],
        subareas: [...this.subareasSel],
        capacidades: caps,
      })
      .subscribe({
        next: (s) => {
          this.solicitud = s;
          this.mostrarForm = false;
          this.mensaje = 'Solicitud enviada. Te llegará la invitación al taller.';
          this.guardando = false;
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo enviar la solicitud.');
          this.guardando = false;
        },
      });
  }

  formatFecha(raw?: string): string {
    if (!raw) return '—';
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? raw : d.toLocaleString('es-AR');
  }
}
