import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CATEGORIAS_INSCRIPCION,
  TIPOS_IDENTIFICACION_INSCRIPCION,
} from '../../models/inscripcion.model';
import { RegistroService } from '../../servicios/registro.service';
import { mensajeErrorApi } from '../../utils/api-error.util';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page registro-page">
      <div class="auth-card registro-card">
        <div class="auth-header">
          <div class="auth-icon registro-icon" aria-hidden="true">+</div>
          <span class="registro-eyebrow">Sumate al congreso</span>
          <h2>Creá tu cuenta</h2>
          <p>
            Creá tu cuenta con los datos del certificado. Después del login completás la inscripción
            al congreso.
          </p>
        </div>

        @if (mensaje) {
          <p class="ok">{{ mensaje }}</p>
        }
        @if (error) {
          <p class="error">{{ error }}</p>
        }

        <form [formGroup]="form" (ngSubmit)="guardar()" class="auth-form registro-form">
          <label>
            Nombre (tal como aparecerá en el certificado)
            <input formControlName="nombre" autocomplete="given-name" />
          </label>
          <label>
            Apellido (tal como aparecerá en el certificado)
            <input formControlName="apellido" autocomplete="family-name" />
          </label>
          <label>
            Email
            <input formControlName="email" type="email" autocomplete="email" />
          </label>
          <label>
            Teléfono (formato internacional)
            <input formControlName="telefono" placeholder="+54 9 221 1234567" autocomplete="tel" />
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
          <label>
            Categoría
            <select formControlName="categoria">
              <option value="">Seleccioná una categoría</option>
              @for (c of categorias; track c.value) {
                <option [value]="c.value">{{ c.label }}</option>
              }
            </select>
          </label>
          <label>
            Contraseña
            <div class="password-field">
              <input
                [type]="mostrarPassword ? 'text' : 'password'"
                formControlName="password"
                autocomplete="new-password"
              />
              <button type="button" class="btn-link" (click)="mostrarPassword = !mostrarPassword">
                {{ mostrarPassword ? 'Ocultar' : 'Ver' }}
              </button>
            </div>
          </label>
          <label>
            Confirmar contraseña
            <div class="password-field">
              <input
                [type]="mostrarConfirm ? 'text' : 'password'"
                formControlName="confirmPassword"
                autocomplete="new-password"
              />
              <button type="button" class="btn-link" (click)="mostrarConfirm = !mostrarConfirm">
                {{ mostrarConfirm ? 'Ocultar' : 'Ver' }}
              </button>
            </div>
          </label>
          @if (form.hasError('passwordMismatch') && form.get('confirmPassword')?.touched) {
            <p class="error registro-form-mensaje">Las contraseñas no coinciden</p>
          }

          <button
            type="submit"
            class="btn-primary-full registro-submit"
            [disabled]="form.invalid || guardando"
          >
            Registrarse
          </button>
        </form>

        <p class="auth-footer">
          ¿Ya tenés cuenta?
          <a routerLink="/login">Iniciar sesión</a>
        </p>
      </div>
    </div>
  `,
})
export class RegistroComponent {
  private fb = inject(FormBuilder);

  categorias = [...CATEGORIAS_INSCRIPCION];
  tiposId = [...TIPOS_IDENTIFICACION_INSCRIPCION];
  mostrarPassword = false;
  mostrarConfirm = false;
  mensaje = '';
  error = '';
  guardando = false;

  form = this.fb.group(
    {
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.minLength(6)]],
      tipoIdentificacion: ['DNI', Validators.required],
      numeroIdentificacion: ['', Validators.required],
      nacionalidad: ['Argentina', Validators.required],
      categoria: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: (g) => this.passwordsMatch(g) }
  );

  constructor(
    private registroService: RegistroService,
    private router: Router
  ) {}

  guardar(): void {
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    this.mensaje = '';
    this.error = '';
    this.guardando = true;
    this.registroService
      .registrarParticipante({
        nombre: raw.nombre!,
        apellido: raw.apellido!,
        email: raw.email!,
        password: raw.password!,
        categoria: raw.categoria!,
        telefono: raw.telefono!,
        tipoIdentificacion: raw.tipoIdentificacion!,
        numeroIdentificacion: raw.numeroIdentificacion!,
        nacionalidad: raw.nacionalidad!,
      })
      .subscribe({
        next: () => {
          this.mensaje = 'Cuenta creada. Iniciá sesión para completar tu inscripción al congreso...';
          this.guardando = false;
          setTimeout(() => this.router.navigate(['/login']), 1500);
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo completar el registro. Verificá el email.');
          this.guardando = false;
        },
      });
  }

  private passwordsMatch(group: AbstractControl) {
    const pwd = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pwd === confirm ? null : { passwordMismatch: true };
  }
}
