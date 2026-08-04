import { Component, ViewChild } from '@angular/core';
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
import {
  ValidacionEfectivoModalComponent,
  ValidacionEfectivoResultado,
} from '../../../components/validacion-efectivo-modal/validacion-efectivo-modal.component';
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
    ValidacionEfectivoModalComponent,
  ],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">💳</span>
        <div>
          <h1>Pagos pendientes</h1>
          <p>Validá comprobantes y cobros en efectivo</p>
        </div>
      </div>

      <section class="panel-card">
      <p class="muted">
        Al aprobar un pago se confirma la inscripción vinculada y el usuario recibe el rol
        <strong>Asistente</strong>. En efectivo se exige número de recibo de caja.
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
              <app-pago-fila
                [pago]="p"
                [disabled]="procesandoId != null"
                (aprobar)="iniciarAprobacion($event)"
                (rechazar)="validar($event, false)"
              />
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

      </section>

      <p class="panel-volver">
        <a routerLink="/admin/pagos/todos">Listado de pagos</a>
        <a routerLink="/admin/pagos/arqueo">Arqueo</a>
        <a routerLink="/admin">← Volver al panel</a>
      </p>
    </div>

    <app-validacion-efectivo-modal
      #modalEfectivo
      [abierto]="modalEfectivoAbierto"
      [disabled]="procesandoId != null"
      (confirmarValidacion)="onConfirmarEfectivo($event)"
      (cancelar)="cerrarModalEfectivo()"
    />
  `,
})
export class PagosPendientesComponent extends ListadoPaginadoBase {
  @ViewChild('modalEfectivo') modalEfectivo?: ValidacionEfectivoModalComponent;

  readonly filterFields: FilterFieldConfig[] = [
    { key: 'monto', label: 'Monto', type: 'number', placeholder: 'Ej. 1500' },
    { key: 'motivoRechazo', label: 'Motivo rechazo', placeholder: 'Buscar motivo' },
  ];
  readonly filterKeys = ['monto', 'motivoRechazo'] as const;

  override pageSize = 20;
  pagos: Pago[] = [];
  mensaje = '';
  procesandoId?: number;
  modalEfectivoAbierto = false;
  private pendienteEfectivo?: Pago;

  constructor(private pagoService: PagoService) {
    super();
  }

  iniciarAprobacion(pago: Pago): void {
    if (pago.metodo === 'EFECTIVO') {
      this.pendienteEfectivo = pago;
      this.modalEfectivo?.reset();
      this.modalEfectivoAbierto = true;
      return;
    }
    this.validar(pago, true);
  }

  onConfirmarEfectivo(data: ValidacionEfectivoResultado): void {
    if (!this.pendienteEfectivo) {
      return;
    }
    // El backend asigna REC-AAAA-NNNNN en la misma transacción.
    this.validar(
      this.pendienteEfectivo,
      true,
      undefined,
      data.observaciones,
      data.efectivoFisicoRecibido
    );
  }

  cerrarModalEfectivo(): void {
    this.modalEfectivoAbierto = false;
    this.pendienteEfectivo = undefined;
  }

  validar(
    pago: Pago,
    aprobar: boolean,
    numeroRecibo?: string,
    observaciones?: string,
    efectivoFisicoRecibido?: boolean
  ): void {
    if (!pago.id || this.procesandoId != null) {
      return;
    }
    let motivoRechazo: string | undefined;
    if (!aprobar) {
      motivoRechazo = prompt('Motivo del rechazo:') ?? undefined;
      if (!motivoRechazo) {
        return;
      }
    }
    this.procesandoId = pago.id;
    this.error = '';
    this.mensaje = '';
    this.pagoService
      .validar(pago.id, {
        aprobar,
        motivoRechazo,
        numeroRecibo,
        observaciones,
        efectivoFisicoRecibido,
      })
      .subscribe({
        next: (res) => {
          this.mensaje = res.mensaje;
          this.procesandoId = undefined;
          this.modalEfectivoAbierto = false;
          this.pendienteEfectivo = undefined;
          this.cargarPagina();
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo validar el pago.');
          this.procesandoId = undefined;
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
