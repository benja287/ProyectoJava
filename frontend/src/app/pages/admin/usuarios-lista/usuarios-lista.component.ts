import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioService } from '../../../servicios/usuario.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { UsuarioFilaComponent } from './usuario-fila.component';

@Component({
  selector: 'app-usuarios-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, UsuarioFilaComponent],
  template: `
    <section class="card">
      <h1>Gestión de usuarios — Listado</h1>
      <p>Perfil administrador (Entrega 5).</p>

      @if (cargando) {
        <p>Cargando usuarios...</p>
      }
      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (!cargando && !error) {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Apellido y nombre</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Roles</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (u of usuarios; track u.id) {
              <app-usuario-fila [usuario]="u" (eliminar)="confirmarBaja($event)" />
            }
          </tbody>
        </table>
      }

      <p class="actions-top">
        <a routerLink="/admin/usuarios/nuevo">+ Nuevo usuario</a>
        ·
        <a routerLink="/admin">← Menú admin</a>
      </p>
    </section>
  `,
})
export class UsuariosListaComponent implements OnInit {
  usuarios: Usuario[] = [];
  cargando = true;
  error = '';
  mensaje = '';

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargar();
  }

  confirmarBaja(usuario: Usuario): void {
    if (!usuario.id || !confirm(`¿Dar de baja a ${usuario.email}?`)) {
      return;
    }
    this.usuarioService.baja(usuario.id).subscribe({
      next: () => {
        this.mensaje = `Usuario ${usuario.id} eliminado.`;
        this.cargar();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar el usuario.');
      },
    });
  }

  private cargar(): void {
    this.cargando = true;
    this.error = '';
    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar el listado. Verificá el backend.');
        this.cargando = false;
      },
    });
  }
}
