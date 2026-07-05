import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ROLES } from '../../../models/enums';
import { CATEGORIAS_INSCRIPCION } from '../../../models/inscripcion.model';
import { UsuarioService } from '../../../servicios/usuario.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-usuario-alta',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card">
      <h1>Alta de usuario (admin)</h1>
      <p>POST <code>/api/usuarios</code> — distinto del registro de participante.</p>

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

        <label class="span-full">
          Categoría de inscripción
          <select formControlName="categoriaInscripcion">
            <option value="">Sin categoría (opcional)</option>
            @for (c of categorias; track c.value) {
              <option [value]="c.value">{{ c.label }}</option>
            }
          </select>
          <span class="muted">Tarifa y certificados según la categoría elegida al inscribirse al congreso.</span>
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

        <div class="actions span-full">
          <button
            type="submit"
            [disabled]="form.invalid || guardando || rolesSeleccionados.size === 0"
          >
            {{ guardando ? 'Guardando...' : 'Guardar' }}
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
  rolesDisponibles = [...ROLES];
  rolesSeleccionados = new Set<string>();

  form = this.fb.group({
    apellido: ['', Validators.required],
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['12345678', [Validators.required, Validators.minLength(8)]],
    categoriaInscripcion: [''],
    rolActual: ['', Validators.required],
  });

  mensaje = '';
  error = '';
  guardando = false;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

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
  }

  guardar(): void {
    if (this.form.invalid || this.rolesSeleccionados.size === 0) {
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
    this.usuarioService
      .alta({
        apellido: raw.apellido!,
        nombre: raw.nombre!,
        email: raw.email!,
        password: raw.password!,
        categoriaInscripcion: raw.categoriaInscripcion?.trim() || null,
        roles: [...this.rolesSeleccionados],
        rolActual: raw.rolActual!,
      })
      .subscribe({
        next: (creado) => {
          this.mensaje = `Usuario creado (id ${creado.id}).`;
          this.guardando = false;
          setTimeout(() => this.router.navigate(['/admin/usuarios']), 1000);
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo crear el usuario.');
          this.guardando = false;
        },
      });
  }
}
