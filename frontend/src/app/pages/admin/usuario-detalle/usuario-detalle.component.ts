import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ROLES } from '../../../models/enums';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioService } from '../../../servicios/usuario.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-usuario-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">👤</span>
        <div>
          <h1>Detalle de usuario</h1>
          <p>Datos, roles, estado de cuenta y excepciones de cupo</p>
        </div>
      </div>

      <section class="panel-card">
      @if (cargando) {
        <p>Cargando usuario...</p>
      } @else if (error && !usuario) {
        <p class="error">{{ error }}</p>
      } @else if (usuario) {
        <h2>Usuario #{{ usuario.id }}</h2>

        @if (error) {
          <p class="error">{{ error }}</p>
        }
        @if (mensaje) {
          <p class="ok">{{ mensaje }}</p>
        }

        <h2>Modificar datos</h2>
        <p class="muted">PUT <code>/api/usuarios/{{ usuario.id }}</code> — dejá la contraseña vacía para no cambiarla.</p>
        <form [formGroup]="datosForm" (ngSubmit)="guardarDatos()" class="form-grid">
          <label>
            Apellido
            <input formControlName="apellido" />
          </label>
          <label>
            Nombre
            <input formControlName="nombre" />
          </label>
          <label>
            Email
            <input formControlName="email" type="email" />
          </label>
          <label>
            Nueva contraseña (opcional)
            <input formControlName="password" type="password" minlength="8" autocomplete="new-password" />
          </label>
          <div class="actions">
            <button type="submit" [disabled]="datosForm.invalid || procesando">
              Guardar cambios
            </button>
          </div>
        </form>

        <h2>Estado de la cuenta</h2>
        <p>
          <span [class.badge-ok]="usuario.activo" [class.badge-off]="!usuario.activo">
            {{ usuario.activo ? 'Activo' : 'Inactivo' }}
          </span>
        </p>
        <div class="actions">
          @if (usuario.activo) {
            <button type="button" class="btn-warn" (click)="cambiarActivo(false)" [disabled]="procesando">
              Inhabilitar cuenta
            </button>
          } @else {
            <button type="button" class="btn-ok" (click)="cambiarActivo(true)" [disabled]="procesando">
              Habilitar cuenta
            </button>
          }
        </div>

        <h2>Asignar roles</h2>
        <p class="muted">Roles actuales: {{ usuario.roles?.join(', ') || '—' }} · Rol en sesión: {{ usuario.rolActual || '—' }}</p>
        <form [formGroup]="rolesForm" (ngSubmit)="guardarRoles()" class="form-grid">
          <fieldset class="roles-fieldset">
            <legend>Roles</legend>
            @for (rol of rolesDisponibles; track rol) {
              <label class="checkbox-inline">
                <input type="checkbox" [value]="rol" (change)="toggleRol(rol, $event)" [checked]="rolesSeleccionados.has(rol)" />
                {{ rol }}
              </label>
            }
          </fieldset>
          <label>
            Rol actual
            <select formControlName="rolActual">
              <option value="">Seleccionar...</option>
              @for (rol of rolesDisponibles; track rol) {
                <option [value]="rol">{{ rol }}</option>
              }
            </select>
          </label>
          <button type="submit" [disabled]="procesando || rolesSeleccionados.size === 0">Guardar roles</button>
        </form>

        <h2>Excepción de cupo de envío</h2>
        <p class="muted">
          Opcional: subir el máximo de trabajos activos de este usuario sin cambiar el cupo global
          del comité.
        </p>
        <form [formGroup]="cuposForm" (ngSubmit)="guardarCupos()" class="form-grid">
          <label>
            Máx. AUTOR (vacío = global)
            <input type="number" min="1" max="20" formControlName="maxTrabajosAutorOverride" />
          </label>
          <label>
            Máx. ASISTENTE (vacío = global)
            <input type="number" min="1" max="20" formControlName="maxTrabajosAsistenteOverride" />
          </label>
          <div class="actions">
            <button type="submit" [disabled]="procesando">Guardar cupos</button>
            <button type="button" class="btn-secundario" (click)="quitarCupos()" [disabled]="procesando">
              Quitar excepciones
            </button>
          </div>
        </form>
      }
      </section>

      <p class="panel-volver"><a routerLink="/admin/usuarios">← Volver al listado</a></p>
    </div>
  `,
})
export class UsuarioDetalleComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);

  usuario?: Usuario;
  cargando = true;
  error = '';
  mensaje = '';
  procesando = false;
  rolesDisponibles = [...ROLES];
  rolesSeleccionados = new Set<string>();
  datosForm = this.fb.group({
    apellido: ['', Validators.required],
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
  });
  rolesForm = this.fb.group({ rolActual: [''] });
  cuposForm = this.fb.group({
    maxTrabajosAutorOverride: [null as number | null],
    maxTrabajosAsistenteOverride: [null as number | null],
  });
  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id) {
        this.error = 'ID inválido';
        this.cargando = false;
        return;
      }
      this.cargar(id);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  guardarDatos(): void {
    if (!this.usuario?.id || this.datosForm.invalid) {
      return;
    }
    const { apellido, nombre, email, password } = this.datosForm.getRawValue();
    if (password && password.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }
    this.procesando = true;
    this.mensaje = '';
    this.error = '';
    this.usuarioService
      .modificar(this.usuario.id, {
        apellido: apellido!,
        nombre: nombre!,
        email: email!,
        password: password || undefined,
      })
      .subscribe({
        next: (actualizado) => {
          this.usuario = actualizado;
          this.datosForm.patchValue({ password: '' });
          this.mensaje = 'Datos del usuario actualizados.';
          this.procesando = false;
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudieron guardar los datos del usuario.');
          this.procesando = false;
        },
      });
  }

  toggleRol(rol: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.rolesSeleccionados.add(rol);
    } else {
      this.rolesSeleccionados.delete(rol);
    }
  }

  guardarRoles(): void {
    if (!this.usuario?.id) {
      return;
    }
    const rolActual = this.rolesForm.value.rolActual;
    if (!rolActual || this.rolesSeleccionados.size === 0) {
      this.error = 'Seleccioná al menos un rol y el rol actual.';
      return;
    }
    this.procesando = true;
    this.mensaje = '';
    this.error = '';
    this.usuarioService
      .asignarRoles(this.usuario.id, {
        roles: [...this.rolesSeleccionados],
        rolActual,
      })
      .subscribe({
        next: (actualizado) => {
          this.usuario = actualizado;
          this.mensaje = 'Roles actualizados.';
          this.procesando = false;
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudieron actualizar los roles.');
          this.procesando = false;
        },
      });
  }

  cambiarActivo(activo: boolean): void {
    if (!this.usuario?.id) {
      return;
    }
    this.procesando = true;
    this.mensaje = '';
    this.error = '';
    this.usuarioService.setActivo(this.usuario.id, activo).subscribe({
      next: (actualizado) => {
        this.usuario = actualizado;
        this.mensaje = activo ? 'Cuenta habilitada.' : 'Cuenta inhabilitada.';
        this.procesando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'Error al cambiar el estado de la cuenta.');
        this.procesando = false;
      },
    });
  }

  private cargar(id: number): void {
    this.cargando = true;
    this.error = '';
    this.mensaje = '';
    this.usuarioService.buscarPorId(id).subscribe({
      next: (u) => {
        this.usuario = u;
        this.rolesSeleccionados = new Set(u!.roles ?? []);
        this.datosForm.patchValue({
          apellido: u!.apellido,
          nombre: u!.nombre,
          email: u!.email,
          password: '',
        });
        this.rolesForm.patchValue({ rolActual: u!.rolActual ?? '' });
        this.cuposForm.patchValue({
          maxTrabajosAutorOverride: u!.maxTrabajosAutorOverride ?? null,
          maxTrabajosAsistenteOverride: u!.maxTrabajosAsistenteOverride ?? null,
        });
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'Usuario no encontrado');
        this.cargando = false;
      },
    });
  }

  guardarCupos(): void {
    if (!this.usuario?.id) {
      return;
    }
    const raw = this.cuposForm.getRawValue();
    const autor = raw.maxTrabajosAutorOverride;
    const asistente = raw.maxTrabajosAsistenteOverride;
    this.procesando = true;
    this.error = '';
    this.mensaje = '';
    this.usuarioService
      .actualizarCuposEnvio(this.usuario.id, {
        maxTrabajosAutorOverride:
          autor != null && String(autor).trim() !== '' ? Number(autor) : null,
        maxTrabajosAsistenteOverride:
          asistente != null && String(asistente).trim() !== '' ? Number(asistente) : null,
      })
      .subscribe({
        next: (u) => {
          this.usuario = u;
          this.mensaje = 'Excepción de cupo actualizada.';
          this.procesando = false;
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo guardar el cupo.');
          this.procesando = false;
        },
      });
  }

  quitarCupos(): void {
    if (!this.usuario?.id) {
      return;
    }
    this.procesando = true;
    this.error = '';
    this.mensaje = '';
    this.usuarioService
      .actualizarCuposEnvio(this.usuario.id, {
        maxTrabajosAutorOverride: null,
        maxTrabajosAsistenteOverride: null,
        motivo: 'Se quitaron las excepciones de cupo.',
      })
      .subscribe({
        next: (u) => {
          this.usuario = u;
          this.cuposForm.patchValue({
            maxTrabajosAutorOverride: null,
            maxTrabajosAsistenteOverride: null,
          });
          this.mensaje = 'Excepciones de cupo quitadas.';
          this.procesando = false;
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo quitar el cupo.');
          this.procesando = false;
        },
      });
  }
}
