import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import {
  CATEGORIAS_INSCRIPCION,
  etiquetaCategoria,
  TIPOS_IDENTIFICACION_INSCRIPCION,
} from '../../models/inscripcion.model';
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
          <p>Consultá tus datos y editá solo cuando lo necesites</p>
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
            <div class="perfil-card-header">
              <div>
                <h2>Datos personales</h2>
                <p class="muted small">
                  Nombre, contacto, identificación y categoría para certificado e inscripción.
                </p>
              </div>
              @if (!editando) {
                <button type="button" class="btn-secundario" (click)="iniciarEdicion()">
                  Editar perfil
                </button>
              }
            </div>

            @if (!editando) {
              <dl class="perfil-readonly">
                <div>
                  <dt>Nombre</dt>
                  <dd>{{ usuario.nombre || '—' }}</dd>
                </div>
                <div>
                  <dt>Apellido</dt>
                  <dd>{{ usuario.apellido || '—' }}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{{ usuario.email || '—' }}</dd>
                </div>
                <div>
                  <dt>Teléfono</dt>
                  <dd>{{ usuario.telefono || '—' }}</dd>
                </div>
                <div>
                  <dt>Tipo de identificación</dt>
                  <dd>{{ etiquetaTipoId(usuario.tipoIdentificacion) }}</dd>
                </div>
                <div>
                  <dt>Número de identificación</dt>
                  <dd>{{ usuario.numeroIdentificacion || '—' }}</dd>
                </div>
                <div>
                  <dt>Nacionalidad</dt>
                  <dd>{{ usuario.nacionalidad || '—' }}</dd>
                </div>
                <div>
                  <dt>Categoría de inscripción</dt>
                  <dd>{{ categoriaEtiqueta }}</dd>
                </div>
              </dl>
            } @else {
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
                <label>
                  Categoría de inscripción
                  <select formControlName="categoriaInscripcion">
                    <option value="">Seleccioná una categoría</option>
                    @for (c of categorias; track c.value) {
                      <option [value]="c.value">{{ c.label }}</option>
                    }
                  </select>
                  <span class="muted small">Define el arancel al inscribirte al congreso.</span>
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

                <div class="perfil-acciones">
                  <button
                    type="submit"
                    class="btn-primary"
                    [disabled]="form.invalid || guardando"
                  >
                    {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
                  </button>
                  <button
                    type="button"
                    class="btn-secundario"
                    (click)="cancelarEdicion()"
                    [disabled]="guardando"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            }
          </section>

          <section class="panel-card">
            <h2>Información del congreso</h2>
            <p class="muted small">Solo lectura — roles y estado de cuenta.</p>
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
                <dt>Categoría guardada</dt>
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
        align-items: start;
      }
      @media (max-width: 900px) {
        .perfil-layout {
          grid-template-columns: 1fr;
        }
      }
      .perfil-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 0.5rem;
      }
      .perfil-card-header h2 {
        margin: 0 0 0.25rem;
      }
      .perfil-form {
        margin-top: 0.75rem;
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
      .perfil-acciones {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
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
  editando = false;
  error = '';
  mensaje = '';

  readonly etiquetaRol = etiquetaRol;
  readonly tiposId = [...TIPOS_IDENTIFICACION_INSCRIPCION];
  readonly categorias = [...CATEGORIAS_INSCRIPCION];

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    apellido: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(180)]],
    telefono: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(40)]],
    tipoIdentificacion: ['DNI', Validators.required],
    numeroIdentificacion: ['', [Validators.required, Validators.maxLength(60)]],
    nacionalidad: ['', [Validators.required, Validators.maxLength(80)]],
    categoriaInscripcion: ['', Validators.required],
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

  etiquetaTipoId(tipo?: string | null): string {
    if (!tipo) return '—';
    return this.tiposId.find((t) => t.value === tipo)?.label ?? tipo;
  }

  iniciarEdicion(): void {
    this.error = '';
    this.mensaje = '';
    this.rellenarFormularioDesdeUsuario();
    this.editando = true;
  }

  cancelarEdicion(): void {
    this.error = '';
    this.mensaje = '';
    this.rellenarFormularioDesdeUsuario();
    this.editando = false;
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.usuarioService.miPerfil().subscribe({
      next: (u) => {
        this.usuario = u;
        this.rellenarFormularioDesdeUsuario();
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
        categoriaInscripcion: v.categoriaInscripcion,
        ...(quierePassword
          ? { passwordActual: v.passwordActual, passwordNueva: v.passwordNueva }
          : {}),
      })
      .subscribe({
        next: () => {
          this.loginService.refreshUser().subscribe({
            next: (actualizado) => {
              this.usuario = actualizado;
              this.rellenarFormularioDesdeUsuario();
              this.editando = false;
              this.mensaje = 'Perfil actualizado.';
              this.guardando = false;
            },
            error: (err) => {
              this.error = mensajeErrorApi(err, 'Se guardó, pero no se pudo refrescar la sesión.');
              this.guardando = false;
              this.editando = false;
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

  private rellenarFormularioDesdeUsuario(): void {
    const u = this.usuario;
    if (!u) return;
    this.form.patchValue({
      nombre: u.nombre ?? '',
      apellido: u.apellido ?? '',
      email: u.email ?? '',
      telefono: u.telefono ?? '',
      tipoIdentificacion: u.tipoIdentificacion || 'DNI',
      numeroIdentificacion: u.numeroIdentificacion ?? '',
      nacionalidad: u.nacionalidad ?? '',
      categoriaInscripcion: u.categoriaInscripcion ?? '',
      passwordActual: '',
      passwordNueva: '',
      confirmPassword: '',
    });
  }
}
