import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ROLES } from '../../../models/enums';
import {
  CATEGORIAS_INSCRIPCION,
  TIPOS_IDENTIFICACION_INSCRIPCION,
} from '../../../models/inscripcion.model';
import { UsuarioService } from '../../../servicios/usuario.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-usuario-alta',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card">
      <h1>Alta de usuario (admin)</h1>
      <p class="muted">
        <strong>Staff</strong> (admin, evaluador, comité…): alta corta con roles.
        <strong>Asistente</strong>: mismos datos del registro + filiación; se crea inscripción y pago
        en efectivo <em>aprobados</em> (ya asiste al congreso).
      </p>

      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }
      @if (error) {
        <p class="error">{{ error }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="guardar()" class="form-grid form-grid-wide">
        <label>
          Apellido
          <input formControlName="apellido" />
        </label>
        <label>
          Nombre
          <input formControlName="nombre" />
        </label>
        <label class="span-full">
          Email
          <input formControlName="email" type="email" />
        </label>
        <label class="span-full">
          Contraseña
          <input formControlName="password" type="password" minlength="8" autocomplete="new-password" />
        </label>

        <fieldset class="roles-fieldset span-full">
          <legend>Roles del sistema</legend>
          <div class="roles-checkboxes">
            @for (rol of rolesDisponibles; track rol) {
              <label class="checkbox-inline">
                <input
                  type="checkbox"
                  [checked]="rolesSeleccionados.has(rol)"
                  (change)="toggleRol(rol, $event)"
                />
                {{ rol }}
              </label>
            }
          </div>
        </fieldset>

        <label class="span-full">
          Rol actual
          <select formControlName="rolActual">
            <option value="">Seleccionar...</option>
            @for (rol of rolesDisponibles; track rol) {
              <option [value]="rol" [disabled]="!rolesSeleccionados.has(rol)">{{ rol }}</option>
            }
          </select>
          <span class="muted">Perfil con el que ingresará si tiene un solo rol o al elegir sesión.</span>
        </label>

        @if (incluyeAsistente) {
          <fieldset class="span-full" style="border: 1px solid #d0d7de; border-radius: 8px; padding: 1rem; margin: 0">
            <legend>Datos de asistente (obligatorios)</legend>
            <p class="muted small" style="margin-top: 0">
              Se registrará inscripción aprobada + pago en efectivo aprobado (recibo automático) y se
              avisará al usuario.
            </p>
            <div class="form-grid form-grid-wide">
              <label>
                Teléfono
                <input formControlName="telefono" placeholder="+54 9 221 1234567" />
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
                <input formControlName="nacionalidad" placeholder="Argentina" />
              </label>
              <label class="span-full">
                Categoría de inscripción
                <select formControlName="categoriaInscripcion">
                  <option value="">Seleccioná una categoría</option>
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
            </div>
          </fieldset>
        } @else {
          <label class="span-full">
            Categoría de inscripción
            <select formControlName="categoriaInscripcion">
              <option value="">Sin categoría (opcional para staff)</option>
              @for (c of categorias; track c.value) {
                <option [value]="c.value">{{ c.label }}</option>
              }
            </select>
          </label>
        }

        <div class="actions span-full">
          <button
            type="submit"
            [disabled]="form.invalid || guardando || rolesSeleccionados.size === 0"
          >
            {{
              guardando
                ? 'Guardando...'
                : incluyeAsistente
                  ? 'Crear asistente (inscripción + pago)'
                  : 'Guardar'
            }}
          </button>
          <a routerLink="/admin/usuarios">Cancelar</a>
        </div>
      </form>
    </section>
  `,
})
export class UsuarioAltaComponent {
  private fb = inject(FormBuilder);

  categorias = [...CATEGORIAS_INSCRIPCION];
  tiposId = [...TIPOS_IDENTIFICACION_INSCRIPCION];
  rolesDisponibles = [...ROLES];
  rolesSeleccionados = new Set<string>();

  form = this.fb.group({
    apellido: ['', Validators.required],
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['12345678', [Validators.required, Validators.minLength(8)]],
    categoriaInscripcion: [''],
    rolActual: ['', Validators.required],
    telefono: [''],
    tipoIdentificacion: ['DNI'],
    numeroIdentificacion: [''],
    nacionalidad: ['Argentina'],
    institucion: [''],
    provincia: [''],
  });

  mensaje = '';
  error = '';
  guardando = false;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  get incluyeAsistente(): boolean {
    return this.rolesSeleccionados.has('ASISTENTE');
  }

  toggleRol(rol: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.rolesSeleccionados.add(rol);
      if (!this.form.getRawValue().rolActual) {
        this.form.patchValue({ rolActual: rol });
      }
    } else {
      this.rolesSeleccionados.delete(rol);
      if (this.form.getRawValue().rolActual === rol) {
        const primero = [...this.rolesSeleccionados][0] ?? '';
        this.form.patchValue({ rolActual: primero });
      }
    }
    this.actualizarValidadoresAsistente();
  }

  private actualizarValidadoresAsistente(): void {
    for (const key of [
      'telefono',
      'tipoIdentificacion',
      'numeroIdentificacion',
      'nacionalidad',
      'categoriaInscripcion',
      'institucion',
      'provincia',
    ] as const) {
      const ctrl = this.form.get(key);
      if (!ctrl) continue;
      if (this.incluyeAsistente) {
        ctrl.setValidators([Validators.required]);
      } else {
        ctrl.clearValidators();
      }
      ctrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  guardar(): void {
    this.actualizarValidadoresAsistente();
    if (this.form.invalid || this.rolesSeleccionados.size === 0) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    if (!raw.rolActual || !this.rolesSeleccionados.has(raw.rolActual)) {
      this.error = 'El rol actual debe estar entre los roles seleccionados.';
      return;
    }

    this.mensaje = '';
    this.error = '';
    this.guardando = true;

    const payload: Parameters<UsuarioService['alta']>[0] = {
      apellido: raw.apellido!,
      nombre: raw.nombre!,
      email: raw.email!,
      password: raw.password!,
      categoriaInscripcion: raw.categoriaInscripcion?.trim() || null,
      roles: [...this.rolesSeleccionados],
      rolActual: raw.rolActual!,
    };

    if (this.incluyeAsistente) {
      payload.telefono = raw.telefono!.trim();
      payload.tipoIdentificacion = raw.tipoIdentificacion!.trim();
      payload.numeroIdentificacion = raw.numeroIdentificacion!.trim();
      payload.nacionalidad = raw.nacionalidad!.trim();
      payload.institucion = raw.institucion!.trim();
      payload.provincia = raw.provincia!.trim();
    }

    this.usuarioService.alta(payload).subscribe({
      next: (creado) => {
        this.mensaje = this.incluyeAsistente
          ? `Asistente creado (id ${creado.id}) con inscripción y pago aprobados.`
          : `Usuario creado (id ${creado.id}).`;
        this.guardando = false;
        setTimeout(() => this.router.navigate(['/admin/usuarios']), 1200);
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo crear el usuario.');
        this.guardando = false;
      },
    });
  }
}
