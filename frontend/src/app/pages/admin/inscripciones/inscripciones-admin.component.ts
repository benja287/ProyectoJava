import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import {
  FilterBarComponent,
  FilterFieldConfig,
} from '../../../components/filter-bar/filter-bar.component';
import {
  CATEGORIAS_INSCRIPCION,
  InscripcionCongreso,
  etiquetaCategoria,
} from '../../../models/inscripcion.model';
import { InscripcionService } from '../../../servicios/inscripcion.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { filtroFromParams, queryParamsFromFiltro } from '../../../utils/filtro-params.util';

@Component({
  selector: 'app-inscripciones-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FilterBarComponent, ArchivoLinkComponent],
  template: `
    <section class="card">
      <h1>Inscripciones al congreso</h1>
      <p>
        Al aprobar una inscripción, el usuario recibe el rol <strong>Asistente</strong> y se
        confirma el pago vinculado.
      </p>

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
      } @else if (inscripciones.length === 0) {
        <p>No hay inscripciones con esos filtros.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Participante</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Institución</th>
              <th>Certificado</th>
              <th>Pago</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (i of inscripciones; track i.id) {
              <tr>
                <td>{{ i.id }}</td>
                <td>{{ i.usuarioApellido }}, {{ i.usuarioNombre }}<br /><span class="muted">{{ i.usuarioEmail }}</span></td>
                <td>{{ etiqueta(i.categoria) }}</td>
                <td>{{ i.estado }}</td>
                <td>{{ i.institucion || '—' }}</td>
                <td>
                  @if (i.certificadoUrl) {
                    <app-archivo-link [url]="i.certificadoUrl" label="Ver" />
                  } @else {
                    —
                  }
                </td>
                <td>
                  @if (i.pagoId) {
                    #{{ i.pagoId }} — {{ i.pagoEstado }}
                  } @else {
                    Sin pago
                  }
                </td>
                <td class="acciones-celda">
                  @if (i.estado === 'PENDIENTE' && i.id) {
                    <button type="button" class="btn-ok" (click)="validar(i, true)">Aprobar</button>
                    <button type="button" class="btn-warn" (click)="validar(i, false)">Rechazar</button>
                  } @else {
                    —
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      <p><a routerLink="/admin">← Menú admin</a></p>
    </section>
  `,
})
export class InscripcionesAdminComponent implements OnInit {
  readonly filterFields: FilterFieldConfig[] = [
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'PENDIENTE', label: 'PENDIENTE' },
        { value: 'APROBADA', label: 'APROBADA' },
        { value: 'RECHAZADA', label: 'RECHAZADA' },
      ],
    },
    {
      key: 'categoria',
      label: 'Categoría',
      type: 'select',
      options: CATEGORIAS_INSCRIPCION.map((c) => ({ value: c.value, label: c.label })),
    },
  ];
  readonly filterKeys = ['estado', 'categoria'] as const;

  inscripciones: InscripcionCongreso[] = [];
  filtros: Record<string, string> = {};
  cargando = true;
  error = '';
  mensaje = '';

  constructor(
    private inscripcionService: InscripcionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.filtros = filtroFromParams(params, this.filterKeys);
      this.cargar();
    });
  }

  etiqueta(categoria: string): string {
    return etiquetaCategoria(categoria);
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

  validar(inscripcion: InscripcionCongreso, aprobar: boolean): void {
    if (!inscripcion.id) {
      return;
    }
    let motivoRechazo: string | undefined;
    if (!aprobar) {
      motivoRechazo = prompt('Motivo del rechazo:') ?? undefined;
      if (!motivoRechazo) {
        return;
      }
    }
    this.inscripcionService.validar(inscripcion.id, { aprobar, motivoRechazo }).subscribe({
      next: () => {
        this.mensaje = aprobar ? 'Inscripción aprobada.' : 'Inscripción rechazada.';
        this.cargar();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo validar la inscripción.');
      },
    });
  }

  private cargar(): void {
    this.cargando = true;
    this.error = '';
    this.inscripcionService.listar(1, 100, this.filtros).subscribe({
      next: (items) => {
        this.inscripciones = items;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'Error al cargar inscripciones.');
        this.cargando = false;
      },
    });
  }
}
