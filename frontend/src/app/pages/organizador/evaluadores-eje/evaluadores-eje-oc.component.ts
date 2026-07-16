import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FilterBarComponent,
  FilterFieldConfig,
} from '../../../components/filter-bar/filter-bar.component';
import { AppPaginatorComponent } from '../../../components/paginator/app-paginator.component';
import { EJES_TEMATICOS } from '../../../constants/ejes-tematicos';
import { etiquetaCategoria } from '../../../models/inscripcion.model';
import { EvaluadorEjeCupo, Usuario } from '../../../models/usuario.model';
import { UsuarioService } from '../../../servicios/usuario.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { ListadoPaginadoBase } from '../../../utils/listado-paginado.base';

@Component({
  selector: 'app-evaluadores-eje-oc',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FilterBarComponent,
    AppPaginatorComponent,
  ],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--indigo">
        <span class="panel-hero-icon" aria-hidden="true">👤</span>
        <div>
          <h1>Evaluadores por eje temático</h1>
          <p>Cupos por eje, restantes y reinicio cuando se agotan</p>
        </div>
      </div>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <section class="panel-card">
        <div class="comite-section-header">
          <h2>Evaluadores por eje temático</h2>
          <span class="comite-counter"
            >{{ total }} usuario(s)
            @if (totalEvaluadores != null) {
              · Evaluadores: {{ totalEvaluadores }}
            }
          </span>
        </div>

        <p class="notice-box">
          Subsección de postulaciones:
          <a routerLink="/organizador/solicitudes-evaluador">Solicitudes de evaluadores</a>
          (pendientes / aprobadas / rechazadas). Al aprobar se asignan
          <strong>todos</strong> los ejes con capacidad &gt; 0 y sus cupos. Al asignar trabajos se
          descuentan restantes; cuando llegan a 0 podés reiniciar el cupo de ese eje.
        </p>

        <app-filter-bar
          [fields]="filterFields"
          [values]="filtros"
          (filterApply)="onFiltrosAplicar($event)"
          (filterClear)="onFiltrosLimpiar()"
        />

        <div class="evaluadores-grid">
          @if (cargando) {
            <p class="muted">Cargando usuarios...</p>
          } @else if (usuarios.length === 0) {
            <p class="muted">No hay usuarios con esos filtros.</p>
          } @else {
            @for (u of usuarios; track u.id) {
              <article class="evaluador-card">
                <div class="evaluador-card-top">
                  <div>
                    <strong>{{ u.nombre }} {{ u.apellido }}</strong>
                    <p class="muted evaluador-email">{{ u.email }}</p>
                    <div class="rol-badges">
                      @for (r of u.roles ?? []; track r) {
                        <span class="rol-badge">{{ r.toLowerCase() }}</span>
                      }
                    </div>
                  </div>
                  <span
                    class="evaluador-estado"
                    [class.evaluador-estado--ok]="esEvaluadorConEje(u)"
                  >
                    {{ esEvaluadorConEje(u) ? 'Evaluador' : 'No evaluador' }}
                  </span>
                </div>
                <p class="muted categoria-inscripcion">
                  Categoría de inscripción
                  <span class="categoria-inscripcion-valor">{{
                    categoriaLabel(u.categoriaInscripcion)
                  }}</span>
                </p>

                @if (cuposActivos(u).length) {
                  <div class="cupos-lista">
                    <p class="eval-select-label">
                      Ejes y cupos
                      <span class="muted"> — {{ etiquetaOrigenCupo(u) }}</span>
                    </p>
                    <p class="form-hint cupos-hint">
                      Los restantes bajan al asignar un <strong>trabajo</strong> a este evaluador en
                      el comité (no al aprobar la solicitud). Si llegan a 0, usá Reiniciar cupo.
                    </p>
                    <ul>
                      @for (c of cuposActivos(u); track c.ejeTematico) {
                        <li class="cupo-item" [class.cupo-item--agotado]="c.restantes <= 0">
                          <div>
                            <strong>{{ c.ejeTematico }}</strong>
                            <span class="muted">
                              restantes {{ c.restantes }} / {{ c.capacidadMax }}
                              @if (c.restantes < c.capacidadMax && c.restantes > 0) {
                                · en uso
                              }
                              @if (c.restantes <= 0) {
                                · agotado
                              }
                            </span>
                          </div>
                          <div class="cupo-acciones">
                            @if (c.restantes <= 0) {
                              <button
                                type="button"
                                class="btn-secundario"
                                (click)="reiniciarCupo(u, c)"
                                [disabled]="procesando"
                              >
                                Reiniciar cupo
                              </button>
                            }
                            <button
                              type="button"
                              class="btn-quitar-eje"
                              (click)="quitarUnEje(u, c.ejeTematico)"
                              [disabled]="procesando"
                            >
                              Quitar eje
                            </button>
                          </div>
                        </li>
                      }
                    </ul>
                  </div>
                }

                @if (!vieneDeSolicitud(u)) {
                  <label class="eval-select-label">
                    {{
                      esEvaluadorConEje(u)
                        ? 'Sumar otro eje (solo asignación manual)'
                        : 'Elegí eje temático para hacerlo evaluador'
                    }}
                    <select
                      [value]="ejeDraft[u.id!] || ''"
                      (change)="setEjeDraft(u.id!, $any($event.target).value)"
                    >
                      <option value="">Seleccionar eje...</option>
                      @for (eje of ejesDisponiblesPara(u); track eje) {
                        <option [value]="eje">{{ eje }}</option>
                      }
                    </select>
                  </label>
                  <button
                    type="button"
                    class="btn-primary-full"
                    (click)="hacerEvaluador(u)"
                    [disabled]="procesando"
                  >
                    {{
                      esEvaluadorConEje(u)
                        ? 'Asignar eje (cupo 5)'
                        : 'Hacer evaluador en este eje (cupo 5)'
                    }}
                  </button>
                }

                @if (esEvaluadorConEje(u)) {
                  <button
                    type="button"
                    class="btn-quitar-eje"
                    (click)="quitarDelEje(u)"
                    [disabled]="procesando"
                  >
                    Quitar todos los ejes
                  </button>
                  <p class="form-hint">
                    El autor de un trabajo no puede evaluarlo ni gestionarlo como comité (conflicto de
                    interés).
                  </p>
                }
              </article>
            }
          }
        </div>

        @if (!cargando && totalPages > 0) {
          <app-paginator
            [currentPage]="page"
            [totalPages]="totalPages"
            [total]="total"
            [disabled]="cargando || procesando"
            (pageChange)="onPageChange($event)"
          />
        }
      </section>

      <p><a routerLink="/organizador">← Volver al panel del comité</a></p>
    </div>
  `,
  styles: [
    `
      .cupos-lista ul {
        list-style: none;
        margin: 0 0 0.75rem;
        padding: 0;
        display: grid;
        gap: 0.5rem;
      }
      .cupo-item {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.5rem 0.65rem;
        border: 1px solid #dbe3f0;
        border-radius: 8px;
        background: #f8fafc;
      }
      .cupo-item--agotado {
        border-color: #f0c9a0;
        background: #fff8f0;
      }
      .cupo-item .muted {
        display: block;
        font-size: 0.85rem;
      }
      .cupo-acciones {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        align-items: center;
      }
      .cupos-hint {
        margin: 0 0 0.5rem;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class EvaluadoresEjeOcComponent extends ListadoPaginadoBase {
  readonly ejesTematicos = [...EJES_TEMATICOS];

  readonly filterFields: FilterFieldConfig[] = [
    { key: 'email', label: 'Email', placeholder: 'Buscar por email' },
    {
      key: 'esEvaluador',
      label: 'Tipo',
      type: 'select',
      options: [
        { value: 'true', label: 'Solo evaluadores' },
        { value: 'false', label: 'Solo no evaluadores' },
      ],
    },
    {
      key: 'ejeTematico',
      label: 'Eje temático',
      type: 'select',
      options: EJES_TEMATICOS.map((e) => ({ value: e, label: e })),
    },
  ];
  readonly filterKeys = ['email', 'esEvaluador', 'ejeTematico'] as const;

  override pageSize = 12;
  usuarios: Usuario[] = [];
  ejeDraft: Record<number, string> = {};
  procesando = false;
  mensaje = '';
  /** Total global de usuarios con eje (independiente del filtro de la página). */
  totalEvaluadores: number | null = null;

  constructor(private usuarioService: UsuarioService) {
    super();
  }

  esEvaluadorConEje(u: Usuario): boolean {
    return this.cuposActivos(u).length > 0 || !!u.ejeTematicoEvaluador?.trim();
  }

  cuposActivos(u: Usuario): EvaluadorEjeCupo[] {
    return (u.cuposEje || []).filter((c) => c.activo !== false);
  }

  /** Manual = cupo 5; solicitud = capacidades declaradas (pueden ser otras). */
  etiquetaOrigenCupo(u: Usuario): string {
    if (this.vieneDeSolicitud(u)) {
      return 'desde solicitud aprobada';
    }
    return 'asignación manual (cupo 5 por eje)';
  }

  /**
   * Evaluador venido de solicitud: varios ejes y/o capacidades distintas de 5.
   * A esos no se les ofrece “Asignar eje (cupo 5)”.
   */
  vieneDeSolicitud(u: Usuario): boolean {
    const cupos = this.cuposActivos(u);
    if (!cupos.length) return false;
    if (cupos.some((c) => c.capacidadMax !== 5)) return true;
    return cupos.length > 2;
  }

  ejesDisponiblesPara(u: Usuario): string[] {
    const ya = new Set(this.cuposActivos(u).map((c) => c.ejeTematico));
    return this.ejesTematicos.filter((e) => !ya.has(e));
  }

  categoriaLabel(categoria?: string | null): string {
    return etiquetaCategoria(categoria ?? '') || 'Sin categoría';
  }

  setEjeDraft(userId: number, eje: string): void {
    this.ejeDraft = { ...this.ejeDraft, [userId]: eje };
  }

  hacerEvaluador(u: Usuario): void {
    if (!u.id) return;
    const eje = this.ejeDraft[u.id];
    if (!eje) {
      this.error = 'Elegí un eje temático del desplegable.';
      return;
    }
    this.procesando = true;
    this.error = '';
    this.usuarioService.asignarEvaluadorEje(u.id, eje).subscribe({
      next: () => {
        this.mensaje = `${u.nombre} ${u.apellido} quedó con cupo en el eje seleccionado.`;
        this.procesando = false;
        this.ejeDraft = { ...this.ejeDraft, [u.id!]: '' };
        this.cargarPagina();
        this.cargarTotalEvaluadores();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo asignar el evaluador.');
        this.procesando = false;
      },
    });
  }

  reiniciarCupo(u: Usuario, c: EvaluadorEjeCupo): void {
    if (!u.id) return;
    if (
      !confirm(
        `¿Reiniciar el cupo de «${c.ejeTematico}»?\nRestantes volverán a ${c.capacidadMax}.`
      )
    ) {
      return;
    }
    this.procesando = true;
    this.usuarioService.reiniciarCupoEvaluador(u.id, c.ejeTematico).subscribe({
      next: () => {
        this.mensaje = `Cupo reiniciado en «${c.ejeTematico}».`;
        this.procesando = false;
        this.cargarPagina();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo reiniciar el cupo.');
        this.procesando = false;
      },
    });
  }

  quitarUnEje(u: Usuario, eje: string): void {
    if (!u.id || !confirm(`¿Quitar el eje «${eje}» de este evaluador?`)) return;
    this.procesando = true;
    this.usuarioService.quitarEvaluadorEje(u.id, eje).subscribe({
      next: () => {
        this.mensaje = `Se quitó el eje «${eje}».`;
        this.procesando = false;
        this.cargarPagina();
        this.cargarTotalEvaluadores();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo quitar el eje.');
        this.procesando = false;
      },
    });
  }

  quitarDelEje(u: Usuario): void {
    if (!u.id || !confirm('¿Quitar a este usuario de todos los ejes temáticos?')) return;
    this.procesando = true;
    this.usuarioService.quitarEvaluadorEje(u.id).subscribe({
      next: () => {
        this.mensaje = 'Se quitaron todos los ejes del evaluador.';
        this.procesando = false;
        this.cargarPagina();
        this.cargarTotalEvaluadores();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo quitar del eje.');
        this.procesando = false;
      },
    });
  }

  protected override cargarPagina(): void {
    this.iniciarCarga();
    const filtro = {
      ...this.filtros,
      activo: 'true',
    };
    this.usuarioService.listarPagina(this.page, this.pageSize, filtro).subscribe({
      next: (pagina) => {
        this.usuarios = pagina.items;
        this.aplicarPagina(pagina);
        this.cargarTotalEvaluadores();
      },
      error: (err) => {
        this.usuarios = [];
        this.marcarError(
          mensajeErrorApi(err, 'No se pudieron cargar los usuarios para asignar evaluadores.')
        );
      },
    });
  }

  private cargarTotalEvaluadores(): void {
    this.usuarioService.listarPagina(1, 1, { esEvaluador: 'true', activo: 'true' }).subscribe({
      next: (p) => (this.totalEvaluadores = p.total),
      error: () => (this.totalEvaluadores = null),
    });
  }
}
