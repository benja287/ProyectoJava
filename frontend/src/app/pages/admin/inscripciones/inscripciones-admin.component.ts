import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import {
  FilterBarComponent,
  FilterFieldConfig,
} from '../../../components/filter-bar/filter-bar.component';
import { AppPaginatorComponent } from '../../../components/paginator/app-paginator.component';
import {
  CATEGORIAS_INSCRIPCION,
  InscripcionCongreso,
  etiquetaCategoria,
} from '../../../models/inscripcion.model';
import { InscripcionService } from '../../../servicios/inscripcion.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { ListadoPaginadoBase } from '../../../utils/listado-paginado.base';

@Component({
  selector: 'app-inscripciones-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FilterBarComponent,
    ArchivoLinkComponent,
    AppPaginatorComponent,
  ],
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
                  <a [routerLink]="['/admin/inscripciones', i.id]" class="btn-link">Detalle</a>
                  @if (i.estado === 'PENDIENTE' && i.id) {
                    <button
                      type="button"
                      class="btn-ok"
                      (click)="validar(i, true)"
                      [disabled]="procesandoId != null"
                    >
                      {{ procesandoId === i.id ? 'Procesando...' : 'Aprobar' }}
                    </button>
                    <button
                      type="button"
                      class="btn-warn"
                      (click)="validar(i, false)"
                      [disabled]="procesandoId != null"
                    >
                      Rechazar
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>

        <app-paginator
          [currentPage]="page"
          [totalPages]="totalPages"
          [total]="total"
          [disabled]="cargando || procesandoId != null"
          (pageChange)="onPageChange($event)"
        />
      }

      <p><a routerLink="/admin">← Menú admin</a></p>
    </section>
  `,
})
export class InscripcionesAdminComponent extends ListadoPaginadoBase {
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

  override pageSize = 20;
  inscripciones: InscripcionCongreso[] = [];
  mensaje = '';
  procesandoId?: number;

  constructor(private inscripcionService: InscripcionService) {
    super();
  }

  etiqueta(categoria: string): string {
    return etiquetaCategoria(categoria);
  }

  validar(inscripcion: InscripcionCongreso, aprobar: boolean): void {
    if (!inscripcion.id || this.procesandoId != null) {
      return;
    }
    let motivoRechazo: string | undefined;
    if (!aprobar) {
      motivoRechazo = prompt('Motivo del rechazo:') ?? undefined;
      if (!motivoRechazo) {
        return;
      }
    }
    this.procesandoId = inscripcion.id;
    this.error = '';
    this.mensaje = '';
    this.inscripcionService.validar(inscripcion.id, { aprobar, motivoRechazo }).subscribe({
      next: () => {
        this.mensaje = aprobar ? 'Inscripción aprobada.' : 'Inscripción rechazada.';
        this.procesandoId = undefined;
        this.cargarPagina();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo validar la inscripción.');
        this.procesandoId = undefined;
      },
    });
  }

  protected override cargarPagina(): void {
    this.iniciarCarga();
    this.inscripcionService.listarPagina(this.page, this.pageSize, this.filtros).subscribe({
      next: (pagina) => {
        this.inscripciones = pagina.items;
        this.aplicarPagina(pagina);
      },
      error: (err) => {
        this.inscripciones = [];
        this.marcarError(mensajeErrorApi(err, 'Error al cargar inscripciones.'));
      },
    });
  }
}
