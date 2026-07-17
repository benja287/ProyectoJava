import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { etiquetaCategoria, TIPOS_IDENTIFICACION_INSCRIPCION } from '../../models/inscripcion.model';
import { etiquetaRol } from '../../models/role-labels';
import { Usuario } from '../../models/usuario.model';
import { UsuarioService } from '../../servicios/usuario.service';
import { mensajeErrorApi } from '../../utils/api-error.util';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero">
        <span class="panel-hero-icon" aria-hidden="true">👤</span>
        <div>
          <h1>Mi perfil</h1>
          <p>Consultá y actualizá tus datos personales</p>
        </div>
      </div>

      <p class="panel-volver">
        <a [routerLink]="loginService.rutaPanel()">← Volver al panel</a>
      </p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (cargando) {
        <p class="muted">Cargando perfil...</p>
      } @else if (usuario) {
        <div class="perfil-layout">
          <section class="panel-card">
            <h2>Datos editables</h2>
            <p class="muted small">
              Podés cambiar nombre, apellido, email, datos del certificado y contraseña. Los roles y
              la categoría de inscripción los gestiona el congreso.
            </p>

            <form [formGroup]="form" (ngSubmit)="guardar()" class="auth-form perfil-form">
              <label>
                Nombre
                <input formControlName="nombre" autocomplete="given-name" />
              </label>
              <label>
                Apellido
                <input formControlName="apellido" autocomplete="family-name" />
              </label>
              <label>
                Email
                <input formControlName="email" type="email" autocomplete="email" />
              </label>
              <label>
                Teléfono (formato internacional)
                <input formControlName="telefono" placeholder="+54 9 221..." autocomplete="tel" />
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

              <fieldset class="perfil-password">
                <legend>Cambiar contraseña (opcional)</legend>
                <label>
                  Contraseña actual
                  <input
                    formControlName="passwordActual"
                    type="password"
                    autocomplete="current-password"
                  />
                </label>
                <label>
                  Nueva contraseña
                  <input
                    formControlName="passwordNueva"
                    type="password"
                    autocomplete="new-password"
                  />
                </label>
                <label>
                  Confirmar nueva contraseña
                  <input
                    formControlName="confirmPassword"
                    type="password"
                    autocomplete="new-password"
                  />
                </label>
                <p class="muted small">Mínimo 8 caracteres. Dejá vacío para no cambiarla.</p>
              </fieldset>

              <button type="submit" class="btn-primary" [disabled]="form.invalid || guardando">
                {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
              </button>
            </form>
          </section>

          <section class="panel-card">
            <h2>Información del congreso</h2>
            <p class="muted small">Solo lectura — no se editan desde este perfil.</p>
            <dl class="perfil-readonly">
              <div>
                <dt>Estado de cuenta</dt>
                <dd>{{ usuario.activo === false ? 'Deshabilitada' : 'Activa' }}</dd>
              </div>
              <div>
                <dt>Perfil en uso</dt>
                <dd>{{ usuario.rolActual ? etiquetaRol(usuario.rolActual) : 'Sin elegir' }}</dd>
              </div>
              <div>
                <dt>Roles habilitados</dt>
                <dd>
                  @if ((usuario.roles?.length ?? 0) === 0) {
                    Sin roles aún (completá la inscripción)
                  } @else {
                    {{ rolesEtiquetados }}
                  }
                </dd>
              </div>
              <div>
                <dt>Categoría de inscripción</dt>
                <dd>{{ categoriaEtiqueta }}</dd>
              </div>
              @if (usuario.roles?.includes('EVALUADOR')) {
                <div>
                  <dt>Ejes / cupos (evaluador)</dt>
                  <dd>
                    @if ((usuario.cuposEje?.length ?? 0) > 0) {
                      <ul class="cupos-perfil">
                        @for (c of usuario.cuposEje!; track c.ejeTematico) {
                          <li>
                            {{ c.ejeTematico }} — restantes {{ c.restantes }}/{{ c.capacidadMax }}
                          </li>
                        }
                      </ul>
                    } @else {
                      {{ usuario.ejeTematicoEvaluador || 'Sin asignar' }}
                    }
                  </dd>
                </div>
              }
            </dl>
            @if (loginService.tieneVariosRoles()) {
              <a routerLink="/seleccion-rol" class="btn-secundario">Cambiar perfil activo</a>
            }
          </section>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .perfil-layout {
        display: grid;
        gap: 1.25rem;
        grid-template-columns: 1.4fr 1fr;
      }
      @media (max-width: 900px) {
        .perfil-layout {
          grid-template-columns: 1fr;
        }
      }
      .perfil-form {
        margin-top: 1rem;
        max-width: 32rem;
      }
      .perfil-password {
        border: 1px solid #d7dde5;
        border-radius: 8px;
        padding: 0.85rem 1rem 1rem;
        margin: 0.5rem 0 1rem;
      }
      .perfil-password legend {
        padding: 0 0.35rem;
        font-weight: 600;
      }
      .perfil-readonly {
        margin: 1rem 0;
        display: grid;
        gap: 0.85rem;
      }
      .cupos-perfil {
        margin: 0.25rem 0 0;
        padding-left: 1.1rem;
      }
      .perfil-readonly div {
        display: grid;
        gap: 0.15rem;
      }
      .perfil-readonly dt {
        font-size: 0.8rem;
        color: #667085;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .perfil-readonly dd {
        margin: 0;
        font-weight: 600;
      }
    `,
  ],
})
export class MiPerfilComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  readonly loginService = inject(LoginService);

  usuario: Usuario | null = null;
  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';

  readonly etiquetaRol = etiquetaRol;
  readonly tiposId = [...TIPOS_IDENTIFICACION_INSCRIPCION];

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    apellido: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(180)]],
    telefono: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(40)]],
    tipoIdentificacion: ['DNI', Validators.required],
    numeroIdentificacion: ['', [Validators.required, Validators.maxLength(60)]],
    nacionalidad: ['', [Validators.required, Validators.maxLength(80)]],
    passwordActual: [''],
    passwordNueva: ['', [Validators.minLength(8)]],
    confirmPassword: [''],
  });

  get rolesEtiquetados(): string {
    return (this.usuario?.roles ?? []).map((r) => etiquetaRol(r)).join(', ');
  }

  get categoriaEtiqueta(): string {
    const cat = this.usuario?.categoriaInscripcion;
    return cat ? etiquetaCategoria(cat) : '—';
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.usuarioService.miPerfil().subscribe({
      next: (u) => {
        this.usuario = u;
        this.form.patchValue({
          nombre: u.nombre ?? '',
          apellido: u.apellido ?? '',
          email: u.email ?? '',
          telefono: u.telefono ?? '',
          tipoIdentificacion: u.tipoIdentificacion || 'DNI',
          numeroIdentificacion: u.numeroIdentificacion ?? '',
          nacionalidad: u.nacionalidad ?? '',
          passwordActual: '',
          passwordNueva: '',
          confirmPassword: '',
        });
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar el perfil.');
        this.cargando = false;
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const quierePassword =
      !!v.passwordNueva.trim() || !!v.passwordActual.trim() || !!v.confirmPassword.trim();
    if (quierePassword) {
      if (!v.passwordActual.trim()) {
        this.error = 'Indicá tu contraseña actual para cambiarla.';
        return;
      }
      if (v.passwordNueva.trim().length < 8) {
        this.error = 'La nueva contraseña debe tener al menos 8 caracteres.';
        return;
      }
      if (v.passwordNueva !== v.confirmPassword) {
        this.error = 'La confirmación de contraseña no coincide.';
        return;
      }
    }

    this.guardando = true;
    this.error = '';
    this.mensaje = '';
    this.usuarioService
      .actualizarMiPerfil({
        nombre: v.nombre,
        apellido: v.apellido,
        email: v.email,
        telefono: v.telefono,
        tipoIdentificacion: v.tipoIdentificacion,
        numeroIdentificacion: v.numeroIdentificacion,
        nacionalidad: v.nacionalidad,
        ...(quierePassword
          ? { passwordActual: v.passwordActual, passwordNueva: v.passwordNueva }
          : {}),
      })
      .subscribe({
        next: () => {
          this.loginService.refreshUser().subscribe({
            next: (actualizado) => {
              this.usuario = actualizado;
              this.form.patchValue({
                passwordActual: '',
                passwordNueva: '',
                confirmPassword: '',
              });
              this.mensaje = 'Perfil actualizado.';
              this.guardando = false;
            },
            error: (err) => {
              this.error = mensajeErrorApi(err, 'Se guardó, pero no se pudo refrescar la sesión.');
              this.guardando = false;
              this.cargar();
            },
          });
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo guardar el perfil.');
          this.guardando = false;
        },
      });
  }
}
