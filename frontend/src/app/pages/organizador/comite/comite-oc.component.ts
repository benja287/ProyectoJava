import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { EJES_TEMATICOS, MODALIDAD_LABELS } from '../../../constants/ejes-tematicos';
import { Trabajo } from '../../../models/trabajo.model';
import { Usuario } from '../../../models/usuario.model';
import { AsignacionEvaluacion } from '../../../models/asignacion.model';
import { AsignacionService } from '../../../servicios/asignacion.service';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { UsuarioService } from '../../../servicios/usuario.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { etiquetaCategoria } from '../../../models/inscripcion.model';

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
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ArchivoLinkComponent],
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
        evaluadores del eje → 4) si hay empate 1/1, asigná un 3er evaluador.
      </p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <section class="panel-card comite-deadline">
        <h2>Límite para envíos nuevos de trabajos</h2>
        <p class="muted">Después de esta fecha, no se podrán enviar trabajos nuevos (sí reenvíos por corrección).</p>
        <div class="comite-deadline-row">
          <input type="date" [formControl]="deadlineCtrl" />
          <button type="button" class="btn-primary" (click)="guardarDeadline()" [disabled]="procesando">
            Guardar
          </button>
          <button type="button" class="btn-secundario" (click)="quitarDeadline()" [disabled]="procesando">
            Quitar
          </button>
        </div>
      </section>

      <section class="panel-card">
        <div class="comite-section-header">
          <h2>Evaluadores por eje temático</h2>
          <span class="comite-counter">Evaluadores: {{ evaluadores.length }}</span>
        </div>
        <div class="evaluadores-grid">
          @if (cargandoUsuarios) {
            <p class="muted">Cargando usuarios...</p>
          } @else if (usuarios.length === 0) {
            <p class="error">
              No se pudieron cargar los usuarios. Verificá que estés logueado como Comité Académico.
            </p>
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
                <span class="categoria-inscripcion-valor">{{ categoriaLabel(u.categoriaInscripcion) }}</span>
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
                  Regla: máximo 3 evaluadores por eje. Si quitás a uno del eje, liberás cupo para asignar otro.
                </p>
              }
            </article>
          }
          }
        </div>
      </section>

      <div class="comite-layout">
        <section class="panel-card comite-lista">
          <div class="comite-section-header">
            <h2>Trabajos</h2>
            <span class="comite-counter">{{ trabajos.length }} total</span>
          </div>
          @if (trabajos.length === 0) {
            <p class="muted">No hay trabajos enviados todavía.</p>
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
                      {{ t.tipo }} • Modalidad: {{ modalidadLabel(t.modalidad) }}
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
                    </div>
                  </button>
                </li>
              }
            </ul>
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
              Autor/a: {{ seleccionado.autorNombre }} {{ seleccionado.autorApellido }}
            </p>

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
              <div class="lista-checks comite-checks-grid">
                @for (item of checklistItems; track item.key) {
                  <label class="check-row">
                    <input type="checkbox" [formControl]="checkCtrls[item.key]" />
                    <span>{{ item.label }}</span>
                  </label>
                }
              </div>
              <label>
                Observaciones (se envían al autor)
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
                  No hay suficientes evaluadores configurados para este eje (mínimo 2 disponibles).
                  Primero asigná evaluadores a este eje en "Evaluadores por eje temático" (máximo 3
                  por eje).
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
              <div class="actions">
                <button
                  type="button"
                  class="btn-primary comite-btn-asignar"
                  (click)="asignarEvaluadores(false)"
                  [disabled]="procesando"
                >
                  Asignar evaluadores
                </button>
                @if (hayEmpate) {
                  <button
                    type="button"
                    class="btn-secundario"
                    (click)="asignarEvaluadores(true)"
                    [disabled]="procesando"
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
              <table>
                <thead>
                  <tr>
                    <th>Evaluador</th>
                    <th>Aceptó</th>
                    <th>Recomendación</th>
                    <th>Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of asignaciones; track a.id) {
                    <tr>
                      <td>{{ a.evaluadorApellido }}, {{ a.evaluadorNombre }}</td>
                      <td>{{ a.aceptada ? 'Sí' : 'No' }}</td>
                      <td>{{ a.evaluacionRecomendacion || '—' }}</td>
                      <td>{{ a.evaluacionComentario || '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          }
        </section>
      </div>

      <p><a routerLink="/organizador">← Menú organizador</a></p>
    </div>
  `,
})
export class ComiteOcComponent implements OnInit {
  private fb = inject(FormBuilder);
  readonly Math = Math;
  readonly ejesTematicos = [...EJES_TEMATICOS];
  readonly modalidadLabels = MODALIDAD_LABELS;

  trabajos: Trabajo[] = [];
  usuarios: Usuario[] = [];
  cargandoUsuarios = true;
  seleccionado?: Trabajo;
  asignaciones: AsignacionEvaluacion[] = [];
  evaluadoresSeleccionados = new Set<number>();
  ejeDraft: Record<number, string> = {};
  procesando = false;
  error = '';
  mensaje = '';

  deadlineCtrl = this.fb.control('');
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
    private usuarioService: UsuarioService,
    private congresoConfigService: CongresoConfigService
  ) {}

  ngOnInit(): void {
    this.cargarTrabajos();
    this.cargarUsuarios();
    this.congresoConfigService.obtener().subscribe({
      next: (cfg) => {
        if (cfg.envioTrabajosHasta) {
          this.deadlineCtrl.setValue(cfg.envioTrabajosHasta);
        }
      },
    });
  }

  get evaluadores(): Usuario[] {
    return this.usuarios.filter((u) => !!u.ejeTematicoEvaluador?.trim());
  }

  get evaluadoresDelEje(): Usuario[] {
    const eje = this.seleccionado?.ejeTematico;
    const autorId = this.seleccionado?.autorId;
    if (!eje) return [];
    return this.usuarios.filter(
      (u) => u.ejeTematicoEvaluador === eje && u.id !== autorId
    );
  }

  get mostrarPrecheck(): boolean {
    return this.seleccionado?.estado === 'ENVIADO';
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
    return (this.seleccionado?.aprobaciones ?? 0) === 1 && (this.seleccionado?.rechazos ?? 0) === 1;
  }

  get precheckCompleto(): boolean {
    return Object.values(this.checkCtrls).every((c) => c.value);
  }

  esEvaluadorConEje(u: Usuario): boolean {
    return !!u.ejeTematicoEvaluador?.trim();
  }

  categoriaLabel(categoria?: string | null): string {
    return etiquetaCategoria(categoria ?? '') || 'Sin categoría';
  }

  modalidadLabel(modalidad?: string): string {
    if (!modalidad) return '—';
    return this.modalidadLabels[modalidad as keyof typeof this.modalidadLabels] ?? modalidad;
  }

  etiquetaEstado(estado?: string): string {
    const map: Record<string, string> = {
      ENVIADO: 'Enviado',
      PRECHECK_OK: 'Precheck OK',
      EN_EVALUACION: 'En evaluación',
      PENDIENTE_APROBACION_COMITE: 'Pendiente comité',
      APROBADO: 'Aprobado',
      APROBADO_CON_CORRECCIONES: 'Correcciones',
      RECHAZADO: 'Rechazado',
    };
    return estado ? map[estado] ?? estado : '—';
  }

  claseEstadoBadge(estado?: string): string {
    const map: Record<string, string> = {
      ENVIADO: 'estado-badge--enviado',
      PRECHECK_OK: 'estado-badge--precheck-ok',
      EN_EVALUACION: 'estado-badge--evaluacion',
      PENDIENTE_APROBACION_COMITE: 'estado-badge--pendiente',
      APROBADO: 'estado-badge--aprobado',
      APROBADO_CON_CORRECCIONES: 'estado-badge--correcciones',
      RECHAZADO: 'estado-badge--rechazado',
    };
    return estado ? map[estado] ?? 'estado-badge--enviado' : 'estado-badge--enviado';
  }

  setEjeDraft(userId: number, eje: string): void {
    this.ejeDraft = { ...this.ejeDraft, [userId]: eje };
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

  guardarDeadline(): void {
    const v = this.deadlineCtrl.value?.trim();
    if (!v) {
      this.error = 'Indicá una fecha o usá Quitar.';
      return;
    }
    this.procesando = true;
    this.congresoConfigService.actualizar({ envioTrabajosHasta: v }).subscribe({
      next: () => {
        this.mensaje = `Fecha límite guardada: ${v}.`;
        this.procesando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo guardar la fecha.');
        this.procesando = false;
      },
    });
  }

  quitarDeadline(): void {
    this.procesando = true;
    this.congresoConfigService.actualizar({ envioTrabajosHasta: null }).subscribe({
      next: () => {
        this.deadlineCtrl.reset('');
        this.mensaje = 'Se quitó la fecha límite.';
        this.procesando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo quitar la fecha.');
        this.procesando = false;
      },
    });
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
        this.cargarUsuarios();
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
        this.cargarUsuarios();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo quitar del eje.');
        this.procesando = false;
      },
    });
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
        this.cargarTrabajos();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo registrar el precheck.');
        this.procesando = false;
      },
    });
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
    this.procesando = true;
    this.asignacionService
      .asignarVarios(this.seleccionado.id, ids, tercerEvaluador || this.hayEmpate)
      .subscribe({
        next: () => {
          this.mensaje = 'Evaluadores asignados.';
          this.procesando = false;
          this.cargarTrabajos();
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
        this.cargarTrabajos();
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

  private cargarTrabajos(): void {
    this.trabajoService.listarComite().subscribe({
      next: (items) => {
        this.trabajos = items;
        if (this.seleccionado?.id) {
          this.seleccionado = this.trabajos.find((t) => t.id === this.seleccionado!.id) ?? this.seleccionado;
        }
      },
      error: (err) => (this.error = mensajeErrorApi(err, 'No se pudieron cargar trabajos.')),
    });
  }

  private cargarUsuarios(): void {
    this.cargandoUsuarios = true;
    this.usuarioService.listar(1, 500).subscribe({
      next: (items) => {
        this.usuarios = items.filter((u) => u.activo !== false);
        this.cargandoUsuarios = false;
      },
      error: (err) => {
        this.usuarios = [];
        this.cargandoUsuarios = false;
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
