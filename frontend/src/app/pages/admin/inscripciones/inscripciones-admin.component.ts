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
  esPagoEfectivo,
  etiquetaCategoria,
  etiquetaMetodoPago,
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
        Al aprobar, el usuario pasa a <strong>Asistente</strong> y se confirma el pago.
        <strong>Transferencia:</strong> basta con revisar el comprobante enviado.
        <strong>Efectivo:</strong> no hay archivo; aprobá solo si ya validaste el cobro en caja /
        acreditación.
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
        <div class="inscripciones-lista">
          @for (i of inscripciones; track i.id) {
            <article class="inscripcion-admin-card" [class.inscripcion-admin-card--efectivo]="esEfectivo(i)">
              <header class="inscripcion-admin-card__header">
                <div>
                  <h2>
                    {{ i.usuarioNombre }} {{ i.usuarioApellido }}
                  </h2>
                  <p class="muted">{{ i.usuarioEmail }}</p>
                  @if (i.requiereFactura) {
                    <p class="muted small"><strong>Solicitó factura</strong></p>
                  }
                </div>
                <span class="estado-badge">{{ i.estado }}</span>
              </header>

              @if (i.estado === 'PENDIENTE' && esEfectivo(i)) {
                <p class="aviso-amarillo">
                  <strong>Efectivo / presencial — validar cobro antes de aprobar</strong>
                </p>
                <p class="muted small">
                  Sin archivo (correcto para efectivo). Aprobá cuando conste el pago en caja /
                  acreditación.
                  @if (i.requiereFactura) {
                    El usuario pidió factura: figura el aviso debajo del nombre.
                  }
                </p>
              } @else if (i.estado === 'PENDIENTE') {
                <p class="aviso-info">
                  <strong>Transferencia — alcanza con mirar el comprobante</strong>
                </p>
                <p class="muted small">
                  El usuario envió comprobante digital. Revisalo y, si está correcto, aprobá.
                </p>
              }

              <dl class="inscripcion-admin-card__meta">
                <div>
                  <dt>Categoría</dt>
                  <dd>{{ etiqueta(i.categoria) }}</dd>
                </div>
                <div>
                  <dt>Forma de pago</dt>
                  <dd>{{ etiquetaMetodo(i.pagoMetodo) }} — {{ i.pagoEstado || 'sin pago' }}</dd>
                </div>
                <div>
                  <dt>Institución</dt>
                  <dd>{{ i.institucion || '—' }}</dd>
                </div>
                @if (i.requiereFactura) {
                  <div>
                    <dt>Factura</dt>
                    <dd>Solicitó factura</dd>
                  </div>
                }
              </dl>

              <div class="inscripcion-admin-card__files">
                @if (i.certificadoUrl) {
                  <app-archivo-link [url]="i.certificadoUrl" label="Ver certificado" />
                } @else {
                  <span class="muted small">Sin certificado de categoría</span>
                }
                @if (i.pagoComprobanteUrl) {
                  <app-archivo-link [url]="i.pagoComprobanteUrl" label="Ver comprobante" />
                } @else if (esEfectivo(i)) {
                  <span class="muted small">Sin archivo (efectivo)</span>
                }
              </div>

              <div class="acciones-celda">
                <a [routerLink]="['/admin/inscripciones', i.id]" class="btn-link">Detalle</a>
                @if (i.estado === 'PENDIENTE' && i.id) {
                  <button
                    type="button"
                    class="btn-ok"
                    (click)="validar(i, true)"
                    [disabled]="procesandoId != null"
                  >
                    {{
                      procesandoId === i.id
                        ? 'Procesando...'
                        : esEfectivo(i)
                          ? 'Aprobar (cobro efectivo OK)'
                          : 'Aprobar'
                    }}
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
              </div>
            </article>
          }
        </div>

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
  styles: [
    `
      .inscripciones-lista {
        display: grid;
        gap: 1rem;
        margin: 1rem 0;
      }
      .inscripcion-admin-card {
        border: 1px solid #d7dde5;
        border-radius: 10px;
        padding: 1rem 1.1rem;
        background: #fff;
      }
      .inscripcion-admin-card--efectivo {
        border-color: #e6c36a;
        background: #fffdf6;
      }
      .inscripcion-admin-card__header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
      }
      .inscripcion-admin-card__header h2 {
        margin: 0;
        font-size: 1.1rem;
      }
      .inscripcion-admin-card__meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 0.75rem;
        margin: 0.85rem 0;
      }
      .inscripcion-admin-card__meta dt {
        font-size: 0.75rem;
        color: #667085;
        text-transform: uppercase;
      }
      .inscripcion-admin-card__meta dd {
        margin: 0.15rem 0 0;
        font-weight: 600;
      }
      .inscripcion-admin-card__files {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }
      .aviso-amarillo {
        margin: 0.75rem 0 0.35rem;
        padding: 0.65rem 0.8rem;
        border-radius: 8px;
        background: #fff3cd;
        color: #664d03;
      }
      .aviso-info {
        margin: 0.75rem 0 0.35rem;
        padding: 0.65rem 0.8rem;
        border-radius: 8px;
        background: #e8f1fb;
        color: #1e3a5f;
      }
    `,
  ],
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

  etiquetaMetodo(metodo?: string | null): string {
    return etiquetaMetodoPago(metodo);
  }

  esEfectivo(i: InscripcionCongreso): boolean {
    return esPagoEfectivo(i);
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
    } else if (this.esEfectivo(inscripcion)) {
      const ok = confirm(
        '¿Confirmás que ya verificaste el cobro en efectivo (caja / recepción / acreditación)?\n\nAl aprobar, el usuario pasa a Asistente.'
      );
      if (!ok) {
        return;
      }
    }
    this.procesandoId = inscripcion.id;
    this.error = '';
    this.mensaje = '';
    this.inscripcionService.validar(inscripcion.id, { aprobar, motivoRechazo }).subscribe({
      next: () => {
        this.mensaje = aprobar
          ? 'Inscripción aprobada. El usuario ahora es Asistente.'
          : 'Inscripción rechazada.';
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
