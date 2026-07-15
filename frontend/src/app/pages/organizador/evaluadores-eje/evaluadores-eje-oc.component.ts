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
import { Usuario } from '../../../models/usuario.model';
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
          <p>Asignar y quitar evaluadores en cada eje</p>
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
                @if (!esEvaluadorConEje(u)) {
                  <label class="eval-select-label">
                    Elegí eje temático para hacerlo evaluador
                    <select
                      [value]="ejeDraft[u.id!] || ''"
                      (change)="setEjeDraft(u.id!, $any($event.target).value)"
                    >
                      <option value="">Seleccionar eje...</option>
                      @for (eje of ejesTematicos; track eje) {
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
                    Hacer evaluador en este eje
                  </button>
                } @else {
                  <label class="eval-select-label">
                    Eje temático asignado
                    <select disabled>
                      <option>{{ u.ejeTematicoEvaluador || '(sin eje)' }}</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    class="btn-quitar-eje"
                    (click)="quitarDelEje(u)"
                    [disabled]="procesando"
                  >
                    Quitar del eje temático
                  </button>
                  <p class="form-hint">
                    Podés sumar todos los evaluadores que necesites por eje. El autor de un trabajo no
                    puede evaluarlo ni gestionarlo como comité (conflicto de interés).
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
    return !!u.ejeTematicoEvaluador?.trim();
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
        this.mensaje = `${u.nombre} ${u.apellido} quedó como evaluador en el eje seleccionado.`;
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

  quitarDelEje(u: Usuario): void {
    if (!u.id || !confirm('¿Quitar a este usuario del eje temático?')) return;
    this.procesando = true;
    this.usuarioService.quitarEvaluadorEje(u.id).subscribe({
      next: () => {
        this.mensaje = 'Se quitó al evaluador del eje.';
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
