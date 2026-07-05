/**
 * Listado de usuarios (admin) con modal de edición MatDialog.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioService } from '../../../servicios/usuario.service';
import { UsuarioEdicionDialogService } from '../../../servicios/usuario-edicion-dialog.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { filtroFromParams, queryParamsFromFiltro } from '../../../utils/filtro-params.util';
import {
  FilterBarComponent,
  FilterFieldConfig,
} from '../../../components/filter-bar/filter-bar.component';
import { UsuarioFilaComponent } from './usuario-fila.component';

@Component({
  selector: 'app-usuarios-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, UsuarioFilaComponent, FilterBarComponent],
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
  readonly filterFields: FilterFieldConfig[] = [
    { key: 'apellido', label: 'Apellido', placeholder: 'Buscar por apellido' },
    { key: 'nombre', label: 'Nombre', placeholder: 'Buscar por nombre' },
    { key: 'email', label: 'Email', placeholder: 'Buscar por email' },
  ];
  readonly filterKeys = ['apellido', 'nombre', 'email'] as const;

  usuarios: Usuario[] = [];
  filtros: Record<string, string> = {};
  cargando = true;
  error = '';
  mensaje = '';

  constructor(
    private usuarioService: UsuarioService,
    private usuarioEdicionDialog: UsuarioEdicionDialogService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.filtros = filtroFromParams(params, this.filterKeys);
      this.cargar();
    });
  }

  onFiltrosAplicar(values: Record<string, string>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParamsFromFiltro(values, this.filterKeys),
    });
  }

  onFiltrosLimpiar(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParamsFromFiltro({}, this.filterKeys),
    });
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
        this.usuarios = this.usuarios.filter((u) => u.id !== usuario.id);
        this.mensaje = `Usuario ${usuario.id} eliminado.`;
        this.error = '';
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

  private cargar(): void {
    this.cargando = true;
    this.error = '';
    this.usuarioService.listar(1, 100, this.filtros).subscribe({
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
