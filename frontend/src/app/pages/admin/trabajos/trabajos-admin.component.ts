import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import {
  FilterBarComponent,
  FilterFieldConfig,
} from '../../../components/filter-bar/filter-bar.component';
import { ESTADOS_TRABAJO } from '../../../models/enums';
import { Trabajo } from '../../../models/trabajo.model';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { filtroFromParams, queryParamsFromFiltro } from '../../../utils/filtro-params.util';

@Component({
  selector: 'app-trabajos-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, ArchivoLinkComponent, FilterBarComponent],
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
      }

      <p><a routerLink="/admin">← Panel admin</a></p>
    </section>
  `,
})
export class TrabajosAdminComponent implements OnInit {
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

  trabajos: Trabajo[] = [];
  filtros: Record<string, string> = {};
  cargando = true;
  error = '';
  mensaje = '';

  constructor(
    private trabajoService: TrabajoService,
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

  eliminar(t: Trabajo): void {
    if (!t.id || !confirm(`¿Eliminar trabajo #${t.id} "${t.titulo}"?`)) {
      return;
    }
    this.trabajoService.baja(t.id).subscribe({
      next: () => {
        this.mensaje = `Trabajo #${t.id} eliminado.`;
        this.cargar();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar el trabajo.');
      },
    });
  }

  private cargar(): void {
    this.cargando = true;
    this.error = '';
    this.trabajoService.listar(1, 100, this.filtros).subscribe({
      next: (items) => {
        this.trabajos = items;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'Error al cargar trabajos.');
        this.cargando = false;
      },
    });
  }
}
