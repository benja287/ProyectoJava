import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Pago } from '../../../models/pago.model';
import { PagoService } from '../../../servicios/pago.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { filtroFromParams, queryParamsFromFiltro } from '../../../utils/filtro-params.util';
import {
  FilterBarComponent,
  FilterFieldConfig,
} from '../../../components/filter-bar/filter-bar.component';
import { PagoFilaComponent } from './pago-fila.component';

@Component({
  selector: 'app-pagos-pendientes',
  standalone: true,
  imports: [CommonModule, RouterLink, PagoFilaComponent, FilterBarComponent],
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
      }

      <p><a routerLink="/admin">← Menú admin</a></p>
    </section>
  `,
})
export class PagosPendientesComponent implements OnInit {
  readonly filterFields: FilterFieldConfig[] = [
    { key: 'monto', label: 'Monto', type: 'number', placeholder: 'Ej. 1500' },
    { key: 'motivoRechazo', label: 'Motivo rechazo', placeholder: 'Buscar motivo' },
  ];
  readonly filterKeys = ['monto', 'motivoRechazo'] as const;

  pagos: Pago[] = [];
  filtros: Record<string, string> = {};
  cargando = true;
  error = '';
  mensaje = '';

  constructor(
    private pagoService: PagoService,
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
        this.cargar();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo validar el pago.');
      },
    });
  }

  private cargar(): void {
    this.cargando = true;
    this.error = '';
    this.pagoService.listarPendientes(1, 100, this.filtros).subscribe({
      next: (items) => {
        this.pagos = items;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'Error al cargar pagos pendientes.');
        this.cargando = false;
      },
    });
  }
}
