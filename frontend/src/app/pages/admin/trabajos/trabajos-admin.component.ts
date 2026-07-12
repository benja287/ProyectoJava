import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import {
  FilterBarComponent,
  FilterFieldConfig,
} from '../../../components/filter-bar/filter-bar.component';
import { AppPaginatorComponent } from '../../../components/paginator/app-paginator.component';
import { ESTADOS_TRABAJO } from '../../../models/enums';
import { Trabajo } from '../../../models/trabajo.model';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { ListadoPaginadoBase } from '../../../utils/listado-paginado.base';

@Component({
  selector: 'app-trabajos-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ArchivoLinkComponent,
    FilterBarComponent,
    AppPaginatorComponent,
  ],
  template: `
    <section class="card">
      <h1>Listado de trabajos</h1>
      <p>Admin — limpieza y gestión. DELETE <code>/api/trabajos/{{ '{' }}id{{ '}' }}</code></p>

      <app-filter-bar
        [fields]="filterFields"
        [values]="filtros"
        (filterApply)="onFiltrosAplicar($event)"
        (filterClear)="onFiltrosLimpiar()"
      />

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (cargando) {
        <p>Cargando...</p>
      } @else if (trabajos.length === 0) {
        <p>No hay trabajos registrados.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Autor</th>
              <th>Estado</th>
              <th>Documento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (t of trabajos; track t.id) {
              <tr>
                <td>{{ t.id }}</td>
                <td>{{ t.titulo }}</td>
                <td>{{ t.autorApellido }}, {{ t.autorNombre }}</td>
                <td>{{ t.estado }}</td>
                <td>
                  @if (t.documentoUrl) {
                    <app-archivo-link [url]="t.documentoUrl" label="Ver" />
                  } @else {
                    —
                  }
                </td>
                <td>
                  <button type="button" class="btn-warn" (click)="eliminar(t)">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <app-paginator
          [currentPage]="page"
          [totalPages]="totalPages"
          [total]="total"
          [disabled]="cargando"
          (pageChange)="onPageChange($event)"
        />
      }

      <p><a routerLink="/admin">← Panel admin</a></p>
    </section>
  `,
})
export class TrabajosAdminComponent extends ListadoPaginadoBase {
  readonly filterFields: FilterFieldConfig[] = [
    { key: 'titulo', label: 'Título', placeholder: 'Buscar por título' },
    { key: 'resumen', label: 'Resumen', placeholder: 'Buscar en resumen' },
    { key: 'ejeTematico', label: 'Eje temático', placeholder: 'Buscar eje' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: ESTADOS_TRABAJO.map((e) => ({ value: e, label: e })),
    },
  ];
  readonly filterKeys = ['titulo', 'resumen', 'ejeTematico', 'estado'] as const;

  override pageSize = 20;
  trabajos: Trabajo[] = [];
  mensaje = '';

  constructor(private trabajoService: TrabajoService) {
    super();
  }

  eliminar(t: Trabajo): void {
    if (!t.id || !confirm(`¿Eliminar trabajo #${t.id} "${t.titulo}"?`)) {
      return;
    }
    this.trabajoService.baja(t.id).subscribe({
      next: () => {
        this.mensaje = `Trabajo #${t.id} eliminado.`;
        this.cargarPagina();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar el trabajo.');
      },
    });
  }

  protected override cargarPagina(): void {
    this.iniciarCarga();
    this.trabajoService.listarPagina(this.page, this.pageSize, this.filtros).subscribe({
      next: (pagina) => {
        this.trabajos = pagina.items;
        this.aplicarPagina(pagina);
      },
      error: (err) => {
        this.trabajos = [];
        this.marcarError(mensajeErrorApi(err, 'Error al cargar trabajos.'));
      },
    });
  }
}
