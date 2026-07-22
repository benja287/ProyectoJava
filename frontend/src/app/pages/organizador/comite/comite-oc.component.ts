import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import {
  FilterBarComponent,
  FilterFieldConfig,
} from '../../../components/filter-bar/filter-bar.component';
import { AppPaginatorComponent } from '../../../components/paginator/app-paginator.component';
import { MODALIDAD_LABELS } from '../../../constants/ejes-tematicos';
import { CatalogosCongresoService } from '../../../servicios/catalogos-congreso.service';
import { AsignacionEvaluacion } from '../../../models/asignacion.model';
import { Trabajo } from '../../../models/trabajo.model';
import { Usuario } from '../../../models/usuario.model';
import { AsignacionService } from '../../../servicios/asignacion.service';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { UsuarioService } from '../../../servicios/usuario.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { ListadoPaginadoBase } from '../../../utils/listado-paginado.base';
import {
  etiquetaRolEnvio,
  esEnvioAsistente,
  mensajeComiteEmpateEvaluacion,
  mensajeComiteEvaluacionObservado,
  mensajeComitePrecheckObservado,
} from '../../../utils/trabajo-rol.util';
import {
  claseEstadoTrabajoBadge,
  etiquetaEstadoTrabajo,
  opcionesEstadoTrabajo,
} from '../../../models/trabajo-estado-labels';
import {
  etiquetaDecisionEvaluacion,
  etiquetaModalidadRecomendada,
  RubricaEvaluacion,
} from '../../../models/evaluacion.model';

const ESTADOS_COMITE = [
  'ENVIADO',
  'PRECHECK_OK',
  'PRECHECK_OBSERVADO',
  'EN_EVALUACION',
  'PENDIENTE_APROBACION_COMITE',
  'OBSERVADO_EVALUACION',
  'APROBADO',
] as const;

interface PrecheckChecks {
  pdfOk: boolean;
  pagesOk: boolean;
  structureOk: boolean;
  anonymousOk: boolean;
  classificationOk: boolean;
  pertinenceOk: boolean;
  formCompleteOk: boolean;
}

@Component({
  selector: 'app-comite-oc',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    ArchivoLinkComponent,
    FilterBarComponent,
    AppPaginatorComponent,
  ],
  styles: [
    `
      .comite-evals {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 0.75rem;
      }
      .comite-eval-card {
        border: 1px solid #e2e2ea;
        border-radius: 8px;
        padding: 0.85rem 1rem;
        background: #fafafa;
      }
      .comite-eval-card header {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1rem;
        margin-bottom: 0.5rem;
      }
      .comite-eval-dl {
        display: grid;
        grid-template-columns: minmax(8rem, 11rem) 1fr;
        gap: 0.35rem 0.75rem;
        margin: 0;
      }
      .comite-eval-dl dt {
        font-weight: 600;
        color: #555;
      }
      .comite-eval-dl dd {
        margin: 0;
      }
      .comite-interno {
        background: #fff8e6;
        padding: 0.35rem 0.5rem;
        border-radius: 4px;
      }
      .comite-rubrica {
        margin-top: 0.75rem;
      }
      .comite-rubrica ul {
        margin: 0.5rem 0 0;
        padding-left: 1.2rem;
      }
    `,
  ],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--indigo">
        <span class="panel-hero-icon" aria-hidden="true">🎓</span>
        <div>
          <h1>Comité Académico</h1>
          <p>Prevalidación formal y asignación de trabajos a evaluadores por eje temático</p>
        </div>
      </div>

      <p class="comite-pasos">
        Pasos: 1) Seleccioná un trabajo → 2) completá el precheck (OK u observado) → 3) asigná 2
        evaluadores del eje → 4) si hay empate 1/1, asigná un 3er evaluador. Tus propios envíos no
        aparecen acá (conflicto de interés).
      </p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <div class="comite-layout">
        <section class="panel-card comite-lista">
          <div class="comite-section-header">
            <h2>Trabajos</h2>
            <span class="comite-counter">{{ total }} total</span>
          </div>

          <app-filter-bar
            [fields]="filterFields"
            [values]="filtros"
            (filterApply)="onFiltrosAplicar($event)"
            (filterClear)="onFiltrosLimpiar()"
          />

          @if (cargando) {
            <p class="muted">Cargando trabajos...</p>
          } @else if (trabajos.length === 0) {
            <p class="muted">No hay trabajos con esos filtros.</p>
          } @else {
            <ul class="comite-trabajos-lista">
              @for (t of trabajos; track t.id) {
                <li>
                  <button
                    type="button"
                    class="comite-trabajo-item"
                    [class.comite-trabajo-item--activo]="seleccionado?.id === t.id"
                    (click)="seleccionar(t)"
                  >
                    <div class="comite-trabajo-titulo">
                      <strong>{{ t.titulo }}</strong>
                      <span class="estado-badge" [ngClass]="claseEstadoBadge(t.estado)">{{ etiquetaEstado(t.estado) }}</span>
                    </div>
                    <p class="muted">{{ t.ejeTematico }}</p>
                    <p class="comite-trabajo-meta">
                      {{ t.tipo }} • Modalidad: {{ modalidadLabel(t.modalidad) }} • Enviado como:
                      {{ etiquetaRolEnvio(t) }}
                    </p>
                    <p class="muted">Categoría autor/a: {{ t.autorCategoria || 'Sin categoría' }}</p>
                    <p class="comite-trabajo-stats">
                      Asignaciones: {{ t.asignacionesCount ?? 0 }} • Reviews:
                      {{ t.evaluacionesCompletas ?? 0 }} (✓ {{ t.aprobaciones ?? 0 }} / ✗
                      {{ t.rechazos ?? 0 }})
                    </p>
                    <div class="comite-badges-progreso">
                      <span class="badge-progreso badge-progreso--precheck"
                        >Precheck {{ Math.min(t.precheckIntentos ?? 0, 3) }}/3</span
                      >
                      <span class="badge-progreso badge-progreso--revision"
                        >Revisión {{ Math.min(t.revisionIntentos ?? 0, 2) }}/2</span
                      >
                      @if (t.empateEvaluacion || ((t.aprobaciones ?? 0) === 1 && (t.rechazos ?? 0) === 1)) {
                        <span class="badge-progreso badge-progreso--empate">Empate 1/1</span>
                      }
                    </div>
                  </button>
                </li>
              }
            </ul>

            <app-paginator
              [currentPage]="page"
              [totalPages]="totalPages"
              [total]="total"
              [disabled]="cargando"
              (pageChange)="onPageChange($event)"
            />
          }
        </section>

        <section class="panel-card comite-detalle">
          @if (!seleccionado) {
            <p class="muted">Seleccioná un trabajo de la lista para prevalidarlo.</p>
          } @else {
            <div class="comite-detalle-header">
              <h2>{{ seleccionado.titulo }}</h2>
              <span class="estado-badge" [ngClass]="claseEstadoBadge(seleccionado.estado)">{{ etiquetaEstado(seleccionado.estado) }}</span>
            </div>
            <p>{{ seleccionado.resumen || '—' }}</p>
            <p class="muted">
              Participante: {{ seleccionado.autorNombre }} {{ seleccionado.autorApellido }}
              <span class="estado-badge estado-badge--rol-envio">
                Enviado como {{ etiquetaRolEnvio(seleccionado) }}
              </span>
            </p>
            @if (esEnvioAsistente(seleccionado)) {
              <p class="muted small">
                Este trabajo se presentó con cupo de asistente. Al aprobar el dictamen final, el rol
                Autor se habilita automáticamente.
              </p>
            }

            @if (esperandoReenvioPrecheck) {
              <div class="comite-bloque comite-bloque--aviso">
                <p class="notice-box notice-box--amber">
                  {{ mensajeComitePrecheckObservado(seleccionado!) }}
                </p>
                @if (seleccionado!.observacionesPrecheck) {
                  <p class="muted"><strong>Observaciones:</strong> {{ seleccionado!.observacionesPrecheck }}</p>
                }
              </div>
            }

            @if (esperandoReenvioEvaluacion) {
              <div class="comite-bloque comite-bloque--aviso">
                <p class="notice-box notice-box--amber">
                  {{ mensajeComiteEvaluacionObservado(seleccionado!) }}
                </p>
              </div>
            }

            @if (hayEmpate && seleccionado?.estado === 'EN_EVALUACION') {
              <div class="comite-bloque comite-bloque--aviso">
                <p class="notice-box notice-box--amber">
                  {{ mensajeComiteEmpateEvaluacion(seleccionado!) }}
                </p>
              </div>
            }

            @if (mostrarPrecheck) {
              <div class="comite-bloque comite-bloque--precheck">
              <h3>Prevalidación formal (checklist)</h3>
              @if (seleccionado.documentoUrl) {
                <p>
                  <app-archivo-link
                    [url]="seleccionado.documentoUrl"
                    label="Ver / descargar PDF enviado"
                  />
                </p>
              }
              @if (seleccionado.documentoDocxUrl) {
                <p>
                  <app-archivo-link
                    [url]="seleccionado.documentoDocxUrl"
                    label="Descargar Word (.docx)"
                    [download]="true"
                    downloadName="trabajo.docx"
                  />
                </p>
              }
              <div class="lista-checks comite-checks-grid">
                @for (item of checklistItems; track item.key) {
                  <label class="check-row">
                    <input type="checkbox" [formControl]="checkCtrls[item.key]" />
                    <span>{{ item.label }}</span>
                  </label>
                }
              </div>
              <label>
                Observaciones (se envían al {{ participanteObservaciones(seleccionado) }})
                <textarea [formControl]="observacionesCtrl" rows="4" placeholder="Ej: El PDF contiene nombres de autores / excede las 5 páginas / falta resumen, etc."></textarea>
              </label>
              <div class="actions">
                <button
                  type="button"
                  class="btn-ok"
                  (click)="precheck(true)"
                  [disabled]="procesando || !precheckCompleto"
                >
                  Marcar apto (precheck OK)
                </button>
                <button type="button" class="btn-warn" (click)="precheck(false)" [disabled]="procesando">
                  Observar (precheck NO)
                </button>
              </div>
              </div>
            }

            @if (mostrarAsignacion) {
              <div
                class="comite-bloque comite-bloque--asignacion"
                [class.comite-bloque--solo-lectura]="!puedeAsignarEvaluadores"
              >
              <h3>Asignación a evaluadores</h3>
              <p class="comite-eje-trabajo">
                Eje temático del trabajo:
                <strong>{{ seleccionado.ejeTematico || '—' }}</strong>
              </p>

              @if (!puedeAsignarEvaluadores) {
                <div class="aviso-amarillo">
                  <strong>Solo lectura.</strong> Primero marcá el trabajo como
                  <strong>apto (precheck OK)</strong> arriba. Recién entonces podrás seleccionar y
                  asignar evaluadores de este eje.
                </div>
              } @else {
                <p class="muted">
                  Seleccioná {{ maxEvaluadoresRequeridos }} evaluador(es) del eje (el autor del trabajo no
                  aparece en la lista).
                </p>
              }

              <label class="eval-select-label">
                Eje temático del trabajo
                <select disabled [value]="seleccionado.ejeTematico || ''">
                  <option value="">(sin eje)</option>
                  @for (eje of ejesTematicos; track eje) {
                    <option [value]="eje">{{ eje }}</option>
                  }
                </select>
              </label>

              @if (!seleccionado.ejeTematico) {
                <div class="aviso-amarillo">El trabajo no tiene eje temático.</div>
              } @else if (evaluadoresDelEje.length < 2) {
                <div class="aviso-amarillo">
                  No hay suficientes evaluadores configurados para este eje (mínimo 2 disponibles,
                  sin contar al autor del trabajo). Asigná más evaluadores en "Evaluadores por eje
                  temático".
                </div>
              } @else if (!puedeAsignarEvaluadores) {
                <div class="comite-evaluadores-lista comite-evaluadores-lista--lectura">
                  @for (ev of evaluadoresDelEje; track ev.id) {
                    <div class="check-row comite-evaluador-opcion comite-evaluador-opcion--lectura">
                      <div>
                        <strong>{{ ev.nombre }} {{ ev.apellido }}</strong>
                        <p class="muted evaluador-email">{{ ev.email }}</p>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="muted comite-seleccionados">
                  Seleccionados: {{ evaluadoresSeleccionados.size }}/{{ maxEvaluadoresRequeridos }}
                  @if (hayEmpate) {
                    <span>(empate 1/1: se permite 3er evaluador)</span>
                  }
                </p>
                <div class="comite-asignacion-row">
                  <div class="comite-evaluadores-lista">
                    @for (ev of evaluadoresDelEje; track ev.id) {
                      <label
                        class="check-row comite-evaluador-opcion"
                        [class.comite-evaluador-opcion--activo]="evaluadoresSeleccionados.has(ev.id!)"
                      >
                        <div>
                          <strong>{{ ev.nombre }} {{ ev.apellido }}</strong>
                          <p class="muted evaluador-email">{{ ev.email }}</p>
                          @if (cupoRestante(ev, seleccionado.ejeTematico) != null) {
                            <p class="muted">
                              Cupo restante: {{ cupoRestante(ev, seleccionado.ejeTematico) }}
                            </p>
                          }
                        </div>
                        <input
                          type="checkbox"
                          [checked]="evaluadoresSeleccionados.has(ev.id!)"
                          [disabled]="!puedeAsignarEvaluadores || evaluadorCheckboxDeshabilitado(ev.id!)"
                          (change)="toggleEvaluador(ev.id!, $any($event.target).checked)"
                        />
                      </label>
                    }
                  </div>
                  <div class="ejes-disponibles">
                    <p class="muted"><strong>Ejes disponibles</strong></p>
                    @for (eje of ejesTematicos; track eje) {
                      <div
                        class="eje-item"
                        [class.eje-item--activo]="eje === seleccionado.ejeTematico"
                      >
                        {{ eje }}
                      </div>
                    }
                  </div>
                </div>
              }

              @if (asignaciones.length > 0) {
                <div class="comite-estado-evaluadores">
                  <strong>Estado por evaluador</strong>
                  <ul>
                    @for (a of asignaciones; track a.id) {
                      <li>
                        <span>{{ a.evaluadorNombre }} {{ a.evaluadorApellido }}</span>
                        — {{ estadoAsignacion(a) }}
                      </li>
                    }
                  </ul>
                </div>
              }

              @if (puedeAsignarEvaluadores && evaluadoresDelEje.length >= 2) {
              @if (evaluadoresNuevosIds.length === 0 && asignaciones.length > 0) {
                <p class="muted comite-asignacion-ok">
                  Los evaluadores seleccionados ya están asignados a este trabajo.
                </p>
              }
              <div class="actions">
                <button
                  type="button"
                  class="btn-primary comite-btn-asignar"
                  (click)="asignarEvaluadores(false)"
                  [disabled]="procesando || !puedeEnviarAsignacion(false)"
                >
                  Asignar evaluadores
                </button>
                @if (hayEmpate) {
                  <button
                    type="button"
                    class="btn-secundario"
                    (click)="asignarEvaluadores(true)"
                    [disabled]="procesando || !puedeEnviarAsignacion(true)"
                  >
                    Asignar 3er evaluador (solo empate)
                  </button>
                }
              </div>
              <p class="form-hint">
                Los evaluadores deben aceptar la asignación en su panel antes de emitir un veredicto.
                Con 2 evaluaciones favorables el trabajo pasa a confirmación final del comité. En empate
                1/1 asigná un tercer evaluador.
              </p>
              }
              </div>
            }

            @if (seleccionado.estado === 'PENDIENTE_APROBACION_COMITE') {
              <h3>Confirmación final del comité</h3>
              <label>
                Observaciones (obligatorias si rechazás)
                <textarea [formControl]="observacionesFinalCtrl" rows="3"></textarea>
              </label>
              <div class="actions">
                <button type="button" class="btn-ok" (click)="confirmar(true)" [disabled]="procesando">
                  Confirmar aprobación
                </button>
                <button type="button" class="btn-warn" (click)="confirmar(false)" [disabled]="procesando">
                  Rechazo definitivo
                </button>
              </div>
            }

            @if (asignaciones.length > 0) {
              <h3>Evaluaciones registradas</h3>
              <div class="comite-evals">
                @for (a of asignaciones; track a.id) {
                  <article class="comite-eval-card">
                    <header>
                      <strong>{{ a.evaluadorApellido }}, {{ a.evaluadorNombre }}</strong>
                      @if (a.evaluadorEmail) {
                        <span class="muted">{{ a.evaluadorEmail }}</span>
                      }
                      <span class="muted">
                        {{ a.aceptada ? 'Asignación aceptada' : 'Asignación no aceptada' }}
                      </span>
                    </header>
                    @if (a.evaluacionRecomendacion) {
                      <dl class="comite-eval-dl">
                        <dt>Decisión</dt>
                        <dd>{{ etiquetaDecision(a.evaluacionRecomendacion) }}</dd>
                        <dt>Modalidad sugerida</dt>
                        <dd>{{ etiquetaModalidadRec(a.evaluacionModalidadRecomendada) }}</dd>
                        <dt>Comentario a autorxs</dt>
                        <dd>{{ a.evaluacionComentario || '—' }}</dd>
                        <dt>Comentario interno (comisión)</dt>
                        <dd class="comite-interno">{{ a.evaluacionComentarioComite || '—' }}</dd>
                        <dt>Archivo de correcciones</dt>
                        <dd>
                          @if (a.evaluacionArchivoCorreccionUrl) {
                            <app-archivo-link
                              [url]="a.evaluacionArchivoCorreccionUrl"
                              [label]="a.evaluacionArchivoCorreccionNombre || 'Descargar'"
                            />
                          } @else {
                            —
                          }
                        </dd>
                      </dl>
                      @if (resumenRubrica(a.evaluacionRubricaJson); as rub) {
                        <details class="comite-rubrica">
                          <summary>Ver rúbrica (criterios)</summary>
                          <ul>
                            <li>Pertinencia: {{ rub.general?.pertinencia || '—' }}</li>
                            <li>Identidad autorxs: {{ rub.general?.identidadAutor || '—' }}</li>
                            <li>Eje correcto: {{ rub.general?.ejeCorrecto || '—' }}</li>
                            <li>Tipo según evaluador: {{ rub.tipoSegunEvaluador || '—' }}</li>
                            <li>
                              Forma — lenguaje: {{ rub.forma?.lenguaje?.valor || '—' }}, título:
                              {{ rub.forma?.titulo?.valor || '—' }}, resumen:
                              {{ rub.forma?.resumen?.valor || '—' }}, keywords:
                              {{ rub.forma?.palabrasClave?.valor || '—' }}
                            </li>
                            <li>
                              Bibliografía APA: {{ rub.bibliografia?.formatoApa?.valor || '—' }};
                              citas↔refs: {{ rub.bibliografia?.coherenciaCitas?.valor || '—' }}
                            </li>
                          </ul>
                        </details>
                      }
                    } @else {
                      <p class="muted">Sin dictamen aún.</p>
                    }
                  </article>
                }
              </div>
            }
          }
        </section>
      </div>

      <p><a routerLink="/organizador">← Volver al panel del comité</a></p>
    </div>
  `,
})
export class ComiteOcComponent extends ListadoPaginadoBase implements OnInit {
  private fb = inject(FormBuilder);
  readonly Math = Math;
  ejesTematicos: string[] = [];
  readonly modalidadLabels = MODALIDAD_LABELS;

  readonly filterFields: FilterFieldConfig[] = [
    { key: 'titulo', label: 'Título', placeholder: 'Buscar por título' },
    { key: 'ejeTematico', label: 'Eje temático', placeholder: 'Buscar eje' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: opcionesEstadoTrabajo(ESTADOS_COMITE),
    },
  ];
  readonly filterKeys = ['titulo', 'ejeTematico', 'estado'] as const;

  override pageSize = 15;
  trabajos: Trabajo[] = [];
  usuarios: Usuario[] = [];
  seleccionado?: Trabajo;
  asignaciones: AsignacionEvaluacion[] = [];
  evaluadoresSeleccionados = new Set<number>();
  procesando = false;
  mensaje = '';

  observacionesCtrl = this.fb.control('');
  observacionesFinalCtrl = this.fb.control('');

  checklistItems = [
    { key: 'pdfOk' as const, label: 'PDF válido y legible' },
    { key: 'pagesOk' as const, label: 'Hasta 5 páginas' },
    { key: 'structureOk' as const, label: 'Estructura requerida' },
    { key: 'anonymousOk' as const, label: 'Anonimato (doble ciego)' },
    { key: 'classificationOk' as const, label: 'Clasificación correcta' },
    { key: 'pertinenceOk' as const, label: 'Pertinencia temática' },
    { key: 'formCompleteOk' as const, label: 'Formulario completo' },
  ];

  checkCtrls: Record<keyof PrecheckChecks, FormControl<boolean>> = {
    pdfOk: this.fb.control(false, { nonNullable: true }),
    pagesOk: this.fb.control(false, { nonNullable: true }),
    structureOk: this.fb.control(false, { nonNullable: true }),
    anonymousOk: this.fb.control(false, { nonNullable: true }),
    classificationOk: this.fb.control(false, { nonNullable: true }),
    pertinenceOk: this.fb.control(false, { nonNullable: true }),
    formCompleteOk: this.fb.control(false, { nonNullable: true }),
  };

  constructor(
    private trabajoService: TrabajoService,
    private asignacionService: AsignacionService,
    private usuarioService: UsuarioService
  ) {
    super();
  }

  override ngOnInit(): void {
    inject(CatalogosCongresoService).ejesActivos().subscribe({
      next: (ejes) => (this.ejesTematicos = ejes.map((e) => e.codigo)),
    });

    super.ngOnInit();
    this.cargarUsuarios();
  }

  get evaluadoresDelEje(): Usuario[] {
    const eje = this.seleccionado?.ejeTematico;
    const autorId = this.seleccionado?.autorId;
    if (!eje) return [];
    return this.usuarios.filter((u) => {
      if (u.id === autorId) return false;
      const cupos = (u.cuposEje || []).filter((c) => c.activo !== false);
      if (cupos.length > 0) {
        return cupos.some((c) => c.ejeTematico === eje && c.restantes > 0);
      }
      return u.ejeTematicoEvaluador === eje;
    });
  }

  cupoRestante(u: Usuario, eje: string | null | undefined): number | null {
    if (!eje) return null;
    const c = (u.cuposEje || []).find((x) => x.ejeTematico === eje && x.activo !== false);
    return c ? c.restantes : null;
  }

  get mostrarPrecheck(): boolean {
    return this.seleccionado?.estado === 'ENVIADO';
  }

  get esperandoReenvioPrecheck(): boolean {
    return this.seleccionado?.estado === 'PRECHECK_OBSERVADO';
  }

  get esperandoReenvioEvaluacion(): boolean {
    return this.seleccionado?.estado === 'OBSERVADO_EVALUACION';
  }

  readonly etiquetaRolEnvio = etiquetaRolEnvio;
  readonly esEnvioAsistente = esEnvioAsistente;
  readonly mensajeComitePrecheckObservado = mensajeComitePrecheckObservado;
  readonly mensajeComiteEvaluacionObservado = mensajeComiteEvaluacionObservado;
  readonly mensajeComiteEmpateEvaluacion = mensajeComiteEmpateEvaluacion;

  participanteObservaciones(t: Trabajo): string {
    return esEnvioAsistente(t) ? 'asistente' : 'autor';
  }

  get mostrarAsignacion(): boolean {
    const e = this.seleccionado?.estado;
    return e === 'ENVIADO' || e === 'PRECHECK_OK' || e === 'EN_EVALUACION';
  }

  get puedeAsignarEvaluadores(): boolean {
    const e = this.seleccionado?.estado;
    return e === 'PRECHECK_OK' || e === 'EN_EVALUACION';
  }

  get maxEvaluadoresRequeridos(): number {
    return this.hayEmpate ? 3 : 2;
  }

  evaluadorCheckboxDeshabilitado(evaluadorId: number): boolean {
    if (this.evaluadoresSeleccionados.has(evaluadorId)) {
      return false;
    }
    return this.evaluadoresSeleccionados.size >= this.maxEvaluadoresRequeridos;
  }

  estadoAsignacion(a: AsignacionEvaluacion): string {
    if (!a.aceptada) {
      return 'Invitación pendiente (debe aceptar o rechazar en su panel).';
    }
    if (a.evaluacionRecomendacion) {
      return 'Evaluación cargada.';
    }
    return 'Asignación aceptada — pendiente de dictamen.';
  }

  get hayEmpate(): boolean {
    if (this.seleccionado?.empateEvaluacion) {
      return true;
    }
    return (this.seleccionado?.aprobaciones ?? 0) === 1 && (this.seleccionado?.rechazos ?? 0) === 1;
  }

  get precheckCompleto(): boolean {
    return Object.values(this.checkCtrls).every((c) => c.value);
  }

  modalidadLabel(modalidad?: string): string {
    if (!modalidad) return '—';
    return this.modalidadLabels[modalidad as keyof typeof this.modalidadLabels] ?? modalidad;
  }

  etiquetaEstado(estado?: string): string {
    return etiquetaEstadoTrabajo(estado);
  }

  etiquetaDecision(codigo?: string | null): string {
    return etiquetaDecisionEvaluacion(codigo);
  }

  etiquetaModalidadRec(codigo?: string | null): string {
    return etiquetaModalidadRecomendada(codigo);
  }

  resumenRubrica(json?: string | null): RubricaEvaluacion | null {
    if (!json?.trim()) {
      return null;
    }
    try {
      return JSON.parse(json) as RubricaEvaluacion;
    } catch {
      return null;
    }
  }

  claseEstadoBadge(estado?: string): string {
    return claseEstadoTrabajoBadge(estado);
  }

  seleccionar(t: Trabajo): void {
    this.seleccionado = t;
    this.evaluadoresSeleccionados = new Set();
    this.observacionesCtrl.reset('');
    Object.values(this.checkCtrls).forEach((c) => c.reset(false));
    if (t.observacionesPrecheck) {
      this.observacionesCtrl.setValue(t.observacionesPrecheck);
    }
    if (t.id) {
      this.cargarAsignaciones(t.id);
    }
  }

  precheck(apto: boolean): void {
    if (!this.seleccionado?.id) return;
    if (apto && !this.precheckCompleto) {
      this.error = 'Completá todos los criterios del checklist para marcar apto.';
      return;
    }
    if (!confirm(apto ? '¿Marcar como APTO (precheck OK)?' : '¿Marcar como OBSERVADO?')) return;
    const obs = this.observacionesCtrl.value?.trim() || undefined;
    this.procesando = true;
    this.trabajoService.precheck(this.seleccionado.id, apto, obs).subscribe({
      next: (t) => {
        this.mensaje = apto ? 'Precheck OK registrado. Ya podés asignar evaluadores.' : 'Observación registrada.';
        this.procesando = false;
        this.actualizarTrabajo(t);
        this.seleccionado = t;
        if (apto) {
          this.evaluadoresSeleccionados = new Set();
        }
        this.cargarPagina();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo registrar el precheck.');
        this.procesando = false;
      },
    });
  }

  get evaluadoresNuevosIds(): number[] {
    const ya = new Set(
      this.asignaciones.map((a) => a.evaluadorId).filter((id): id is number => id != null)
    );
    return [...this.evaluadoresSeleccionados].filter((id) => !ya.has(id));
  }

  puedeEnviarAsignacion(tercerEvaluador: boolean): boolean {
    const requeridos = tercerEvaluador || this.hayEmpate ? 3 : 2;
    const ids = [...this.evaluadoresSeleccionados];
    if (ids.length < requeridos) {
      return false;
    }
    return this.evaluadoresNuevosIds.length > 0;
  }

  asignarEvaluadores(tercerEvaluador: boolean): void {
    if (!this.seleccionado?.id) return;
    if (!this.puedeAsignarEvaluadores) {
      this.error = 'Primero marcá el trabajo como apto (precheck OK) antes de asignar evaluadores.';
      return;
    }
    const ids = [...this.evaluadoresSeleccionados];
    const requeridos = tercerEvaluador || this.hayEmpate ? 3 : 2;
    if (ids.length < requeridos) {
      this.error = `Seleccioná ${requeridos} evaluador(es).`;
      return;
    }
    if (this.evaluadoresNuevosIds.length === 0) {
      this.mensaje = 'Los evaluadores seleccionados ya están asignados.';
      this.error = '';
      return;
    }
    this.procesando = true;
    this.error = '';
    this.asignacionService
      .asignarVarios(this.seleccionado.id, ids, tercerEvaluador || this.hayEmpate)
      .subscribe({
        next: () => {
          this.mensaje = 'Evaluadores asignados.';
          this.procesando = false;
          this.cargarPagina();
          if (this.seleccionado?.id) {
            this.cargarAsignaciones(this.seleccionado.id);
          }
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudieron asignar evaluadores.');
          this.procesando = false;
        },
      });
  }

  toggleEvaluador(id: number, checked: boolean): void {
    if (!this.puedeAsignarEvaluadores) {
      return;
    }
    if (checked) {
      this.evaluadoresSeleccionados.add(id);
    } else {
      this.evaluadoresSeleccionados.delete(id);
    }
    this.evaluadoresSeleccionados = new Set(this.evaluadoresSeleccionados);
  }

  confirmar(aprobar: boolean): void {
    if (!this.seleccionado?.id) return;
    const obs = this.observacionesFinalCtrl.value?.trim() || '';
    if (!aprobar && !obs) {
      this.error = 'Indicá el motivo del rechazo definitivo.';
      return;
    }
    this.procesando = true;
    this.trabajoService.confirmarComite(this.seleccionado.id, aprobar, obs || undefined).subscribe({
      next: (t) => {
        this.mensaje = aprobar ? 'Trabajo aprobado.' : 'Rechazo definitivo registrado.';
        this.procesando = false;
        this.actualizarTrabajo(t);
        this.cargarPagina();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo confirmar.');
        this.procesando = false;
      },
    });
  }

  private actualizarTrabajo(t: Trabajo): void {
    this.seleccionado = t;
    const idx = this.trabajos.findIndex((x) => x.id === t.id);
    if (idx >= 0) this.trabajos[idx] = t;
  }

  protected override cargarPagina(): void {
    this.iniciarCarga();
    this.trabajoService.listarComitePagina(this.page, this.pageSize, this.filtros).subscribe({
      next: (pagina) => {
        this.trabajos = pagina.items;
        this.aplicarPagina(pagina);
        if (this.seleccionado?.id) {
          this.seleccionado =
            this.trabajos.find((t) => t.id === this.seleccionado!.id) ?? this.seleccionado;
        }
      },
      error: (err) => {
        this.trabajos = [];
        this.marcarError(mensajeErrorApi(err, 'No se pudieron cargar trabajos.'));
      },
    });
  }

  private cargarUsuarios(): void {
    this.usuarioService.listar(1, 500).subscribe({
      next: (items) => {
        this.usuarios = items.filter((u) => u.activo !== false);
      },
      error: (err) => {
        this.usuarios = [];
        this.error = mensajeErrorApi(err, 'No se pudieron cargar los usuarios para asignar evaluadores.');
      },
    });
  }

  private cargarAsignaciones(trabajoId: number): void {
    this.asignacionService.listarPorTrabajo(trabajoId).subscribe({
      next: (items) => {
        this.asignaciones = items;
        const ids = items
          .map((a) => a.evaluadorId)
          .filter((id): id is number => id != null);
        this.evaluadoresSeleccionados = new Set(ids);
      },
      error: () => {
        this.asignaciones = [];
        this.evaluadoresSeleccionados = new Set();
      },
    });
  }
}
