import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { switchMap } from 'rxjs/operators';
import { ROLES } from '../../../models/enums';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioService } from '../../../servicios/usuario.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

export interface UserEditModalData {
  usuario: Usuario;
}

@Component({
  selector: 'app-user-edit-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>Editar usuario #{{ usuario?.id }}</h2>

    <div mat-dialog-content class="user-edit-modal-content">
      @if (cargando) {
        <p>Cargando datos...</p>
      } @else {
        @if (error) {
          <p class="error">{{ error }}</p>
        }

        <form [formGroup]="form" class="form-grid form-grid-wide">
          <mat-form-field appearance="outline">
            <mat-label>Apellido</mat-label>
            <input matInput formControlName="apellido" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="span-full">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="span-full">
            <mat-label>Nueva contraseña (opcional)</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="new-password" />
            <mat-hint>Dejá vacío para no cambiarla (mín. 8 caracteres).</mat-hint>
          </mat-form-field>

          <fieldset class="roles-fieldset span-full">
            <legend>Roles</legend>
            <div class="roles-checkboxes">
              @for (rol of rolesDisponibles; track rol) {
                <mat-checkbox
                  [checked]="rolesSeleccionados.has(rol)"
                  (change)="toggleRol(rol, $event.checked)"
                >
                  {{ rol }}
                </mat-checkbox>
              }
            </div>
          </fieldset>

          <mat-form-field appearance="outline" class="span-full">
            <mat-label>Rol actual</mat-label>
            <mat-select formControlName="rolActual">
              @for (rol of rolesDisponibles; track rol) {
                <mat-option [value]="rol" [disabled]="!rolesSeleccionados.has(rol)">{{ rol }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </form>
      }
    </div>

    <div mat-dialog-actions align="end">
      <button type="button" mat-button (click)="cerrar()">Cancelar</button>
      <button
        type="button"
        mat-flat-button
        color="primary"
        [disabled]="form.invalid || cargando || guardando || rolesSeleccionados.size === 0"
        (click)="guardar()"
      >
        {{ guardando ? 'Guardando...' : 'Guardar' }}
      </button>
    </div>
  `,
})
export class UserEditModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UserEditModalComponent, Usuario | undefined>);
  private data = inject<UserEditModalData>(MAT_DIALOG_DATA);

  usuario?: Usuario;
  cargando = true;
  guardando = false;
  error = '';
  rolesDisponibles = [...ROLES];
  rolesSeleccionados = new Set<string>();

  form = this.fb.group({
    apellido: ['', Validators.required],
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    rolActual: ['', Validators.required],
  });

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    const id = this.data.usuario.id;
    if (!id) {
      this.error = 'Usuario inválido';
      this.cargando = false;
      return;
    }
    this.usuarioService.buscarPorId(id).subscribe({
      next: (u) => {
        if (!u) {
          this.error = 'Usuario no encontrado';
          this.cargando = false;
          return;
        }
        this.usuario = u;
        this.rolesSeleccionados = new Set(u.roles ?? []);
        this.form.patchValue({
          apellido: u.apellido,
          nombre: u.nombre,
          email: u.email,
          password: '',
          rolActual: u.rolActual ?? u.roles?.[0] ?? '',
        });
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar el usuario.');
        this.cargando = false;
      },
    });
  }

  toggleRol(rol: string, checked: boolean): void {
    if (checked) {
      this.rolesSeleccionados.add(rol);
    } else {
      this.rolesSeleccionados.delete(rol);
      if (this.form.getRawValue().rolActual === rol) {
        const primero = [...this.rolesSeleccionados][0] ?? '';
        this.form.patchValue({ rolActual: primero });
      }
    }
  }

  guardar(): void {
    if (!this.usuario?.id || this.form.invalid || this.rolesSeleccionados.size === 0) {
      return;
    }
    const raw = this.form.getRawValue();
    const pwd = raw.password?.trim();
    if (pwd && pwd.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }
    if (!raw.rolActual || !this.rolesSeleccionados.has(raw.rolActual)) {
      this.error = 'El rol actual debe estar entre los roles seleccionados.';
      return;
    }

    this.guardando = true;
    this.error = '';
    this.usuarioService
      .modificar(this.usuario.id, {
        apellido: raw.apellido!,
        nombre: raw.nombre!,
        email: raw.email!,
        password: pwd || undefined,
      })
      .pipe(
        switchMap(() =>
          this.usuarioService.asignarRoles(this.usuario!.id!, {
            roles: [...this.rolesSeleccionados],
            rolActual: raw.rolActual!,
          })
        )
      )
      .subscribe({
        next: (actualizado) => {
          this.guardando = false;
          this.dialogRef.close(actualizado);
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo guardar el usuario.');
          this.guardando = false;
        },
      });
  }

  cerrar(): void {
    this.dialogRef.close(undefined);
  }
}
