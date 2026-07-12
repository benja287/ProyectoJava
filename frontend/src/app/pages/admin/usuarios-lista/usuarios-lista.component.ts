/**
 * Listado de usuarios (admin) con modal de edición MatDialog.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioService } from '../../../servicios/usuario.service';
import { UsuarioEdicionDialogService } from '../../../servicios/usuario-edicion-dialog.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { ListadoPaginadoBase } from '../../../utils/listado-paginado.base';
import {
  FilterBarComponent,
  FilterFieldConfig,
} from '../../../components/filter-bar/filter-bar.component';
import { AppPaginatorComponent } from '../../../components/paginator/app-paginator.component';
import { UsuarioFilaComponent } from './usuario-fila.component';

@Component({
  selector: 'app-usuarios-lista',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UsuarioFilaComponent,
    FilterBarComponent,
    AppPaginatorComponent,
  ],
  template: `
    <section class="card">
      <h1>Gestión de usuarios — Listado</h1>
      <p>Perfil administrador — editá usuarios desde el modal sin salir del listado.</p>

      <app-filter-bar
        [fields]="filterFields"
        [values]="filtros"
        (filterApply)="onFiltrosAplicar($event)"
        (filterClear)="onFiltrosLimpiar()"
      />

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
        <div class="table-wrap">
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
                <app-usuario-fila
                  [usuario]="u"
                  (editar)="abrirEdicion($event)"
                  (toggleActivo)="toggleActivo($event)"
                  (eliminar)="confirmarBaja($event)"
                />
              }
            </tbody>
          </table>
        </div>

        <app-paginator
          [currentPage]="page"
          [totalPages]="totalPages"
          [total]="total"
          [disabled]="cargando"
          (pageChange)="onPageChange($event)"
        />
      }

      <p class="actions-top">
        <a routerLink="/admin/usuarios/nuevo">+ Nuevo usuario</a>
        ·
        <a routerLink="/admin">← Menú admin</a>
      </p>
    </section>
  `,
})
export class UsuariosListaComponent extends ListadoPaginadoBase {
  readonly filterFields: FilterFieldConfig[] = [
    { key: 'apellido', label: 'Apellido', placeholder: 'Buscar por apellido' },
    { key: 'nombre', label: 'Nombre', placeholder: 'Buscar por nombre' },
    { key: 'email', label: 'Email', placeholder: 'Buscar por email' },
  ];
  readonly filterKeys = ['apellido', 'nombre', 'email'] as const;

  override pageSize = 20;
  usuarios: Usuario[] = [];
  mensaje = '';

  constructor(
    private usuarioService: UsuarioService,
    private usuarioEdicionDialog: UsuarioEdicionDialogService
  ) {
    super();
  }

  abrirEdicion(usuario: Usuario): void {
    this.usuarioEdicionDialog.abrir(usuario).subscribe((actualizado) => {
      if (actualizado) {
        this.reemplazarEnLista(actualizado);
        this.mensaje = `Usuario #${actualizado.id} actualizado.`;
        this.error = '';
      }
    });
  }

  toggleActivo(usuario: Usuario): void {
    if (!usuario.id) return;
    const nuevoEstado = !usuario.activo;
    const accion = nuevoEstado ? 'habilitar' : 'inhabilitar';
    if (!confirm(`¿${accion} la cuenta de ${usuario.email}?`)) {
      return;
    }
    this.usuarioService.setActivo(usuario.id, nuevoEstado).subscribe({
      next: (actualizado) => {
        this.reemplazarEnLista(actualizado);
        this.mensaje = nuevoEstado ? 'Cuenta habilitada.' : 'Cuenta inhabilitada.';
        this.error = '';
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cambiar el estado de la cuenta.');
      },
    });
  }

  confirmarBaja(usuario: Usuario): void {
    if (!usuario.id || !confirm(`¿Eliminar definitivamente a ${usuario.email}?`)) {
      return;
    }
    this.usuarioService.baja(usuario.id).subscribe({
      next: () => {
        this.mensaje = `Usuario ${usuario.id} eliminado.`;
        this.error = '';
        this.cargarPagina();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar el usuario.');
      },
    });
  }

  private reemplazarEnLista(actualizado: Usuario): void {
    const idx = this.usuarios.findIndex((u) => u.id === actualizado.id);
    if (idx >= 0) {
      const copia = [...this.usuarios];
      copia[idx] = actualizado;
      this.usuarios = copia;
    }
  }

  protected override cargarPagina(): void {
    this.iniciarCarga();
    this.usuarioService.listarPagina(this.page, this.pageSize, this.filtros).subscribe({
      next: (pagina) => {
        this.usuarios = pagina.items;
        this.aplicarPagina(pagina);
      },
      error: (err) => {
        this.usuarios = [];
        this.marcarError(mensajeErrorApi(err, 'No se pudo cargar el listado. Verificá el backend.'));
      },
    });
  }
}
