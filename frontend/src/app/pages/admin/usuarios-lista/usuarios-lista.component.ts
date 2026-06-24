import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioService } from '../../../servicios/usuario.service';

@Component({
  selector: 'app-usuarios-lista',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="card">
      <h1>Gestión de usuarios — Listado</h1>
      <p>Perfil administrador (Práctica 8 — ítems d y e).</p>

      @if (cargando) {
        <p>Cargando usuarios...</p>
      }
      @if (error) {
        <p class="error">{{ error }}</p>
      }

      @if (!cargando && !error) {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Apellido y nombres</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Roles</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (u of usuarios; track u.id) {
              <tr>
                <td>{{ u.id }}</td>
                <td>{{ u.apellido }}, {{ u.nombres }}</td>
                <td>{{ u.email }}</td>
                <td>
                  <span [class.badge-ok]="u.activo" [class.badge-off]="!u.activo">
                    {{ u.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>{{ u.roles?.join(', ') }}</td>
                <td>
                  <a [routerLink]="['/admin/usuarios', u.id]">Detalle</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      <p class="actions-top">
        <a routerLink="/registro">+ Nuevo usuario</a>
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

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el listado. ¿Está corriendo el backend en :8080?';
        this.cargando = false;
      },
    });
  }
}
