import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ROLES } from '../../../models/enums';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioService } from '../../../servicios/usuario.service';

@Component({
  selector: 'app-usuario-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <section class="card">
      @if (cargando) {
        <p>Cargando usuario...</p>
      } @else if (error) {
        <p class="error">{{ error }}</p>
        <a routerLink="/admin/usuarios">Volver al listado</a>
      } @else if (usuario) {
        <h1>Detalle de usuario #{{ usuario.id }}</h1>

        <dl class="detalle">
          <dt>Apellido</dt>
          <dd>{{ usuario.apellido }}</dd>
          <dt>Nombre</dt>
          <dd>{{ usuario.nombre }}</dd>
          <dt>Email</dt>
          <dd>{{ usuario.email }}</dd>
          <dt>Estado</dt>
          <dd>
            <span [class.badge-ok]="usuario.activo" [class.badge-off]="!usuario.activo">
              {{ usuario.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </dd>
          <dt>Roles actuales</dt>
          <dd>{{ usuario.roles?.join(', ') || '—' }}</dd>
          <dt>Rol actual</dt>
          <dd>{{ usuario.rolActual || '—' }}</dd>
        </dl>

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

        @if (mensaje) {
          <p class="ok">{{ mensaje }}</p>
        }

        <p><a routerLink="/admin/usuarios">← Volver al listado</a></p>
      }
    </section>
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
  rolesForm = this.fb.group({ rolActual: [''] });
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
        error: () => {
          this.error = 'No se pudieron actualizar los roles.';
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
    this.usuarioService.setActivo(this.usuario.id, activo).subscribe({
      next: (actualizado) => {
        this.usuario = actualizado;
        this.mensaje = activo ? 'Cuenta habilitada.' : 'Cuenta inhabilitada.';
        this.procesando = false;
      },
      error: () => {
        this.error = 'Error al cambiar el estado de la cuenta.';
        this.procesando = false;
      },
    });
  }

  private cargar(id: number): void {
    this.cargando = true;
    this.error = '';
    this.usuarioService.buscarPorId(id).subscribe({
      next: (u) => {
        this.usuario = u;
        this.rolesSeleccionados = new Set(u!.roles ?? []);
        this.rolesForm.patchValue({ rolActual: u!.rolActual ?? '' });
        this.cargando = false;
      },
      error: () => {
        this.error = 'Usuario no encontrado';
        this.cargando = false;
      },
    });
  }
}
