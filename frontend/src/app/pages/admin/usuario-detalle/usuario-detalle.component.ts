import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioService } from '../../../servicios/usuario.service';

@Component({
  selector: 'app-usuario-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
          <dt>DNI</dt>
          <dd>{{ usuario.dni || '—' }}</dd>
          <dt>Apellido</dt>
          <dd>{{ usuario.apellido }}</dd>
          <dt>Nombres</dt>
          <dd>{{ usuario.nombres }}</dd>
          <dt>Domicilio</dt>
          <dd>{{ usuario.domicilio || '—' }}</dd>
          <dt>Género</dt>
          <dd>{{ usuario.genero || '—' }}</dd>
          <dt>Email</dt>
          <dd>{{ usuario.email }}</dd>
          <dt>Estado</dt>
          <dd>
            <span [class.badge-ok]="usuario.activo" [class.badge-off]="!usuario.activo">
              {{ usuario.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </dd>
          <dt>Roles</dt>
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

        @if (mensaje) {
          <p class="ok">{{ mensaje }}</p>
        }

        <p><a routerLink="/admin/usuarios">← Volver al listado</a></p>
      }
    </section>
  `,
})
export class UsuarioDetalleComponent implements OnInit, OnDestroy {
  usuario?: Usuario;
  cargando = true;
  error = '';
  mensaje = '';
  procesando = false;
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

  cambiarActivo(activo: boolean): void {
    if (!this.usuario?.id) {
      return;
    }
    this.procesando = true;
    this.mensaje = '';
    this.usuarioService.setActivo(this.usuario.id, activo).subscribe({
      next: (actualizado) => {
        if (actualizado) {
          this.usuario = actualizado;
          this.mensaje = activo ? 'Cuenta habilitada.' : 'Cuenta inhabilitada.';
        } else {
          this.error = 'No se pudo actualizar el estado.';
        }
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
        if (!u) {
          this.error = 'Usuario no encontrado';
        } else {
          this.usuario = u;
        }
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar el usuario';
        this.cargando = false;
      },
    });
  }
}
