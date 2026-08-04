import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import {
  FilterBarComponent,
  FilterFieldConfig,
} from '../../../components/filter-bar/filter-bar.component';
import { AppPaginatorComponent } from '../../../components/paginator/app-paginator.component';
import { ESTADOS_PAGO } from '../../../models/enums';
import { Pago } from '../../../models/pago.model';
import { PagoService } from '../../../servicios/pago.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { ListadoPaginadoBase } from '../../../utils/listado-paginado.base';

@Component({
  selector: 'app-pagos-lista',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ArchivoLinkComponent,
    FilterBarComponent,
    AppPaginatorComponent,
  ],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">💳</span>
        <div>
          <h1>Listado de pagos</h1>
          <p>Todos los estados — limpieza y gestión</p>
        </div>
      </div>

      <section class="panel-card">
      <p class="muted">Admin — todos los estados. DELETE <code>/api/pagos/{{ '{' }}id{{ '}' }}</code></p>

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
      } @else if (pagos.length === 0) {
        <p>No hay pagos registrados.</p>
      } @else {
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
              <tr>
                <td>{{ p.id }}</td>
                <td>{{ p.monto | number: '1.2-2' }}</td>
                <td>{{ p.metodo }}</td>
                <td>{{ p.estado }}</td>
                <td>{{ p.fechaRegistro || '—' }}</td>
                <td>
                  @if (p.comprobanteUrl) {
                    <app-archivo-link [url]="p.comprobanteUrl" label="Ver" />
                  } @else {
                    —
                  }
                </td>
                <td class="acciones-celda">
                  <a [routerLink]="['/admin/pagos', p.id]" class="btn-link">Detalle</a>
                  <button type="button" class="btn-warn" (click)="eliminar(p)">Eliminar</button>
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

      </section>

      <p class="panel-volver">
        <a routerLink="/admin/pagos">Validar pendientes</a>
        <a routerLink="/admin">← Volver al panel</a>
      </p>
    </div>
  `,
})
export class PagosListaComponent extends ListadoPaginadoBase {
  readonly filterFields: FilterFieldConfig[] = [
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: ESTADOS_PAGO.map((e) => ({ value: e, label: e })),
    },
    { key: 'monto', label: 'Monto', type: 'number', placeholder: 'Ej. 1500' },
    { key: 'motivoRechazo', label: 'Motivo rechazo', placeholder: 'Buscar motivo' },
  ];
  readonly filterKeys = ['estado', 'monto', 'motivoRechazo'] as const;

  override pageSize = 20;
  pagos: Pago[] = [];
  mensaje = '';

  constructor(private pagoService: PagoService) {
    super();
  }

  eliminar(p: Pago): void {
    if (!p.id || !confirm(`¿Eliminar pago #${p.id}?`)) {
      return;
    }
    this.pagoService.baja(p.id).subscribe({
      next: () => {
        this.mensaje = `Pago #${p.id} eliminado.`;
        this.cargarPagina();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar el pago.');
      },
    });
  }

  protected override cargarPagina(): void {
    this.iniciarCarga();
    this.pagoService.listarPagina(this.page, this.pageSize, this.filtros).subscribe({
      next: (pagina) => {
        this.pagos = pagina.items;
        this.aplicarPagina(pagina);
      },
      error: (err) => {
        this.pagos = [];
        this.marcarError(mensajeErrorApi(err, 'Error al cargar pagos.'));
      },
    });
  }
}
