import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import {
  FilterBarComponent,
  FilterFieldConfig,
} from '../../../components/filter-bar/filter-bar.component';
import { ESTADOS_PAGO } from '../../../models/enums';
import { Pago } from '../../../models/pago.model';
import { PagoService } from '../../../servicios/pago.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { filtroFromParams, queryParamsFromFiltro } from '../../../utils/filtro-params.util';

@Component({
  selector: 'app-pagos-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, ArchivoLinkComponent, FilterBarComponent],
  template: `
    <section class="card">
      <h1>Listado de pagos</h1>
      <p>Admin — todos los estados. DELETE <code>/api/pagos/{{ '{' }}id{{ '}' }}</code></p>

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
                <td>
                  <button type="button" class="btn-warn" (click)="eliminar(p)">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      <p>
        <a routerLink="/admin/pagos">Validar pendientes</a>
        ·
        <a routerLink="/admin">← Panel admin</a>
      </p>
    </section>
  `,
})
export class PagosListaComponent implements OnInit {
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

  eliminar(p: Pago): void {
    if (!p.id || !confirm(`¿Eliminar pago #${p.id}?`)) {
      return;
    }
    this.pagoService.baja(p.id).subscribe({
      next: () => {
        this.mensaje = `Pago #${p.id} eliminado.`;
        this.cargar();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar el pago.');
      },
    });
  }

  private cargar(): void {
    this.cargando = true;
    this.error = '';
    this.pagoService.listar(1, 100, this.filtros).subscribe({
      next: (items) => {
        this.pagos = items;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'Error al cargar pagos.');
        this.cargando = false;
      },
    });
  }
}
