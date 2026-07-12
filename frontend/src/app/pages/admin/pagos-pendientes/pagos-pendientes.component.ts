import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Pago } from '../../../models/pago.model';
import { PagoService } from '../../../servicios/pago.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { ListadoPaginadoBase } from '../../../utils/listado-paginado.base';
import {
  FilterBarComponent,
  FilterFieldConfig,
} from '../../../components/filter-bar/filter-bar.component';
import { AppPaginatorComponent } from '../../../components/paginator/app-paginator.component';
import { PagoFilaComponent } from './pago-fila.component';

@Component({
  selector: 'app-pagos-pendientes',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PagoFilaComponent,
    FilterBarComponent,
    AppPaginatorComponent,
  ],
  template: `
    <section class="card">
      <h1>Pagos pendientes de validación</h1>
      <p>
        Al aprobar un pago se confirma la inscripción vinculada y el usuario recibe el rol
        <strong>Asistente</strong>.
      </p>

      <app-filter-bar
        [fields]="filterFields"
        [values]="filtros"
        (filterApply)="onFiltrosAplicar($event)"
        (filterClear)="onFiltrosLimpiar()"
      />

      @if (cargando) {
        <p>Cargando...</p>
      }
      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (!cargando && pagos.length === 0) {
        <p>No hay pagos pendientes.</p>
      }

      @if (pagos.length > 0) {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Comprobante</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (p of pagos; track p.id) {
              <app-pago-fila [pago]="p" (aprobar)="validar(p, true)" (rechazar)="validar(p, false)" />
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

      <p>
        <a routerLink="/admin/pagos/todos">Listado de pagos (limpieza)</a>
        ·
        <a routerLink="/admin">← Panel admin</a>
      </p>
    </section>
  `,
})
export class PagosPendientesComponent extends ListadoPaginadoBase {
  readonly filterFields: FilterFieldConfig[] = [
    { key: 'monto', label: 'Monto', type: 'number', placeholder: 'Ej. 1500' },
    { key: 'motivoRechazo', label: 'Motivo rechazo', placeholder: 'Buscar motivo' },
  ];
  readonly filterKeys = ['monto', 'motivoRechazo'] as const;

  override pageSize = 20;
  pagos: Pago[] = [];
  mensaje = '';

  constructor(private pagoService: PagoService) {
    super();
  }

  validar(pago: Pago, aprobar: boolean): void {
    if (!pago.id) {
      return;
    }
    let motivoRechazo: string | undefined;
    if (!aprobar) {
      motivoRechazo = prompt('Motivo del rechazo:') ?? undefined;
      if (!motivoRechazo) {
        return;
      }
    }
    this.pagoService.validar(pago.id, { aprobar, motivoRechazo }).subscribe({
      next: (res) => {
        this.mensaje = res.mensaje;
        this.cargarPagina();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo validar el pago.');
      },
    });
  }

  protected override cargarPagina(): void {
    this.iniciarCarga();
    this.pagoService.listarPendientesPagina(this.page, this.pageSize, this.filtros).subscribe({
      next: (pagina) => {
        this.pagos = pagina.items;
        this.aplicarPagina(pagina);
      },
      error: (err) => {
        this.pagos = [];
        this.marcarError(mensajeErrorApi(err, 'Error al cargar pagos pendientes.'));
      },
    });
  }
}
