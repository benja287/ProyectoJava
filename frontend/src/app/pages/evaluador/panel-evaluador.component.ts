import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../components/archivo-link/archivo-link.component';
import { MODALIDAD_LABELS } from '../../constants/ejes-tematicos';
import { LoginService } from '../../auth/login.service';
import { AsignacionEvaluacion } from '../../models/asignacion.model';
import { Trabajo } from '../../models/trabajo.model';
import { AsignacionService } from '../../servicios/asignacion.service';
import { EvaluacionService } from '../../servicios/evaluacion.service';
import { TrabajoService } from '../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../utils/api-error.util';

@Component({
  selector: 'app-panel-evaluador',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ArchivoLinkComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--violeta">
        <span class="panel-hero-icon" aria-hidden="true">📋</span>
        <div>
          <h1>Panel de Evaluador</h1>
          <p>
            Evaluación de trabajos científicos y propuestas de taller. Las nuevas asignaciones
            requieren que aceptes o rechaces la convocatoria antes del dictamen.
          </p>
        </div>
      </div>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <div class="stats-grid evaluador-stats">
        <div class="stat-card stat-card--amarillo">
          <span class="stat-label">Trabajos Pendientes</span>
          <span class="stat-value stat-value--amber">{{ trabajosPendientes.length }}</span>
        </div>
        <div class="stat-card stat-card--verde">
          <span class="stat-label">Evaluados</span>
          <span class="stat-value stat-value--green">{{ trabajosEvaluados.length }}</span>
        </div>
        <div class="stat-card stat-card--azul">
          <span class="stat-label">Aprobados</span>
          <span class="stat-value stat-value--blue">{{ trabajosAprobados.length }}</span>
        </div>
      </div>

      <section class="panel-card evaluador-seccion">
        <div class="evaluador-seccion-header">
          <span class="evaluador-seccion-icon" aria-hidden="true">📄</span>
          <div>
            <h2>Trabajos Propuestos</h2>
            <p class="muted">Pendientes: {{ trabajosPendientes.length }}</p>
          </div>
        </div>

        @if (cargando) {
          <p class="muted">Cargando asignaciones...</p>
        } @else if (trabajosPendientes.length === 0) {
          <div class="evaluador-vacio">No hay trabajos pendientes de evaluación</div>
        } @else {
          <div class="evaluador-panel-cards">
            @for (a of trabajosPendientes; track a.id) {
              <article class="evaluador-panel-card">
                <div class="evaluador-panel-card-header">
                  <div>
                    <h3>{{ a.trabajoTitulo }}</h3>
                    <div class="evaluador-tags">
                      <span class="tag tag--tipo">{{ etiquetaTipo(a.trabajoTipo) }}</span>
                      @if (a.trabajoModalidad) {
                        <span class="tag tag--modalidad"
                          >Modalidad: {{ modalidadLabel(a.trabajoModalidad) }}</span
                        >
                      }
                      @if (a.trabajoEjeTematico) {
                        <span class="tag tag--eje">{{ a.trabajoEjeTematico }}</span>
                      }
                      <span class="tag tag--pendiente">Pendiente</span>
                    </div>
                    @if (a.trabajoDocumentoUrl) {
                      <p class="evaluador-pdf">
                        <app-archivo-link
                          [url]="a.trabajoDocumentoUrl"
                          label="Ver / descargar PDF"
                        />
                      </p>
                    } @else {
                      <p class="muted evaluador-sin-pdf">Sin archivo adjunto</p>
                    }
                  </div>
                </div>

                @if (invitacionPendiente(a)) {
                  <div class="aviso-amarillo">
                    <p>
                      El comité te invitó a evaluar este trabajo. Aceptá la asignación para cargar
                      tu dictamen, o rechazala para que puedan convocar a otro evaluador del mismo
                      eje.
                    </p>
                    <div class="actions">
                      <button
                        type="button"
                        class="btn-ok"
                        (click)="responderAsignacion(a.id, true)"
                        [disabled]="procesando"
                      >
                        Aceptar asignación
                      </button>
                      <button
                        type="button"
                        class="btn-warn"
                        (click)="responderAsignacion(a.id, false)"
                        [disabled]="procesando"
                      >
                        Rechazar asignación
                      </button>
                    </div>
                  </div>
                } @else if (asignacionRechazada(a)) {
                  <p class="muted">Rechazaste esta convocatoria.</p>
                } @else if (puedeDictaminar(a)) {
                  <button
                    type="button"
                    class="evaluador-toggle-comentario"
                    (click)="toggleComentarioTrabajo(a.id)"
                  >
                    {{ comentarioVisibleTrabajo[a.id] ? 'Ocultar comentario' : 'Agregar comentario (opcional)' }}
                  </button>
                  @if (comentarioVisibleTrabajo[a.id]) {
                    <textarea
                      [(ngModel)]="comentariosTrabajo[a.id]"
                      rows="3"
                      placeholder="Escribí tu devolución al autor. Tu identidad no será revelada."
                    ></textarea>
                  }
                  <div class="actions">
                    <button
                      type="button"
                      class="btn-ok"
                      (click)="evaluarTrabajo(a.id, 'APROBADO')"
                      [disabled]="procesando"
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      class="btn-danger"
                      (click)="evaluarTrabajo(a.id, 'RECHAZADO')"
                      [disabled]="procesando"
                    >
                      Rechazar
                    </button>
                  </div>
                }
              </article>
            }
          </div>
        }
      </section>

      <section class="panel-card evaluador-seccion">
        <div class="evaluador-seccion-header">
          <span class="evaluador-seccion-icon evaluador-seccion-icon--teal" aria-hidden="true">🖥</span>
          <div>
            <h2>Talleres Propuestos</h2>
            <p class="muted">Pendientes: {{ talleresPendientes.length }}</p>
          </div>
        </div>

        @if (cargandoTalleres) {
          <p class="muted">Cargando propuestas de taller...</p>
        } @else if (talleresPendientes.length === 0) {
          <div class="evaluador-vacio">No hay talleres pendientes de evaluación</div>
        } @else {
          <div class="evaluador-panel-cards">
            @for (t of talleresPendientes; track t.id) {
              <article class="evaluador-panel-card">
                <div class="evaluador-panel-card-header">
                  <div>
                    <h3>{{ t.titulo }}</h3>
                    @if (t.fechaCreacion) {
                      <p class="muted evaluador-fecha">Enviado: {{ t.fechaCreacion }}</p>
                    }
                    @if (t.resumen) {
                      <p class="evaluador-descripcion">{{ t.resumen }}</p>
                    }
                    @if (t.metodologia) {
                      <p class="evaluador-metodologia">
                        <strong>Metodología:</strong> {{ t.metodologia }}
                      </p>
                    }
                    <div class="evaluador-tags">
                      <span class="tag tag--pendiente">Pendiente</span>
                    </div>
                    @if (t.documentoUrl) {
                      <p class="evaluador-pdf">
                        <app-archivo-link [url]="t.documentoUrl" label="Ver / descargar PDF" />
                      </p>
                    } @else {
                      <p class="muted evaluador-sin-pdf">Sin archivo adjunto</p>
                    }
                  </div>
                </div>

                <button
                  type="button"
                  class="evaluador-toggle-comentario"
                  (click)="toggleComentarioTaller(t.id!)"
                >
                  {{ comentarioVisibleTaller[t.id!] ? 'Ocultar comentario' : 'Agregar comentario (opcional)' }}
                </button>
                @if (comentarioVisibleTaller[t.id!]) {
                  <textarea
                    [(ngModel)]="comentariosTaller[t.id!]"
                    rows="3"
                    placeholder="Escribí tu devolución al proponente. Tu identidad no será revelada."
                  ></textarea>
                }
                <div class="actions">
                  <button
                    type="button"
                    class="btn-ok"
                    (click)="evaluarTaller(t.id!, true)"
                    [disabled]="procesando"
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    class="btn-danger"
                    (click)="evaluarTaller(t.id!, false)"
                    [disabled]="procesando"
                  >
                    Rechazar
                  </button>
                </div>
              </article>
            }
          </div>
        }

        <p class="evaluador-certificado">
          <a routerLink="/evaluador/certificado" class="btn-certificado">Generar Certificado de Asistencia</a>
        </p>
      </section>
    </div>
  `,
})
export class PanelEvaluadorComponent implements OnInit {
  private readonly loginService = inject(LoginService);
  private readonly asignacionService = inject(AsignacionService);
  private readonly evaluacionService = inject(EvaluacionService);
  private readonly trabajoService = inject(TrabajoService);

  asignaciones: AsignacionEvaluacion[] = [];
  talleresPendientes: Trabajo[] = [];
  comentariosTrabajo: Record<number, string> = {};
  comentariosTaller: Record<number, string> = {};
  comentarioVisibleTrabajo: Record<number, boolean> = {};
  comentarioVisibleTaller: Record<number, boolean> = {};
  cargando = true;
  cargandoTalleres = true;
  procesando = false;
  error = '';
  mensaje = '';

  readonly modalidadLabels = MODALIDAD_LABELS;

  ngOnInit(): void {
    this.cargarDatos();
  }

  get asignacionesCientificas(): AsignacionEvaluacion[] {
    return this.asignaciones.filter((a) => a.trabajoTipo !== 'PROPUESTA_TALLER');
  }

  get trabajosPendientes(): AsignacionEvaluacion[] {
    return this.asignacionesCientificas.filter(
      (a) =>
        !a.evaluacionRecomendacion &&
        a.trabajoEstado !== 'RECHAZADO' &&
        a.trabajoEstado !== 'APROBADO' &&
        a.trabajoEstado !== 'PENDIENTE_APROBACION_COMITE'
    );
  }

  get trabajosEvaluados(): AsignacionEvaluacion[] {
    return this.asignacionesCientificas.filter((a) => !!a.evaluacionRecomendacion);
  }

  get trabajosAprobados(): AsignacionEvaluacion[] {
    return this.asignacionesCientificas.filter(
      (a) =>
        a.evaluacionRecomendacion === 'APROBADO' ||
        a.evaluacionRecomendacion === 'APROBADO_CON_CORRECCIONES'
    );
  }

  invitacionPendiente(a: AsignacionEvaluacion): boolean {
    return !a.fechaRespuesta;
  }

  asignacionRechazada(a: AsignacionEvaluacion): boolean {
    return !!a.fechaRespuesta && !a.aceptada;
  }

  puedeDictaminar(a: AsignacionEvaluacion): boolean {
    return !!a.fechaRespuesta && a.aceptada && !a.evaluacionRecomendacion;
  }

  etiquetaTipo(tipo?: string): string {
    const map: Record<string, string> = {
      TRABAJO_CIENTIFICO: 'Científico',
      RELATO_DE_EXPERIENCIA: 'Relato de experiencia',
      PROPUESTA_TALLER: 'Propuesta de taller',
    };
    return tipo ? map[tipo] ?? tipo : 'Tipo: —';
  }

  modalidadLabel(modalidad?: string): string {
    if (!modalidad) return '—';
    return this.modalidadLabels[modalidad as keyof typeof this.modalidadLabels] ?? modalidad;
  }

  toggleComentarioTrabajo(id: number): void {
    this.comentarioVisibleTrabajo[id] = !this.comentarioVisibleTrabajo[id];
  }

  toggleComentarioTaller(id: number): void {
    this.comentarioVisibleTaller[id] = !this.comentarioVisibleTaller[id];
  }

  responderAsignacion(id: number, aceptar: boolean): void {
    const msg = aceptar
      ? '¿Aceptar la asignación para evaluar este trabajo?'
      : '¿Rechazar la convocatoria? El comité podrá asignar otro evaluador.';
    if (!confirm(msg)) return;
    this.procesando = true;
    this.error = '';
    this.asignacionService.responder(id, aceptar).subscribe({
      next: () => {
        this.mensaje = aceptar ? 'Asignación aceptada.' : 'Asignación rechazada.';
        this.procesando = false;
        this.recargarAsignaciones();
      },
      error: (err: unknown) => {
        this.error = mensajeErrorApi(err, 'No se pudo responder la asignación.');
        this.procesando = false;
      },
    });
  }

  evaluarTrabajo(asignacionId: number, recomendacion: string): void {
    const msg =
      recomendacion === 'APROBADO'
        ? '¿Confirmás APROBAR este trabajo?'
        : '¿Confirmás RECHAZAR este trabajo?';
    if (!confirm(msg)) return;
    this.procesando = true;
    this.error = '';
    this.evaluacionService
      .registrar(asignacionId, recomendacion, this.comentariosTrabajo[asignacionId])
      .subscribe({
        next: () => {
          this.mensaje = 'Evaluación registrada.';
          this.procesando = false;
          delete this.comentariosTrabajo[asignacionId];
          delete this.comentarioVisibleTrabajo[asignacionId];
          this.recargarAsignaciones();
        },
        error: (err: unknown) => {
          this.error = mensajeErrorApi(err, 'No se pudo registrar la evaluación.');
          this.procesando = false;
        },
      });
  }

  evaluarTaller(id: number, aprobar: boolean): void {
    const msg = aprobar ? '¿Aprobar esta propuesta de taller?' : '¿Rechazar esta propuesta de taller?';
    if (!confirm(msg)) return;
    this.procesando = true;
    this.error = '';
    this.trabajoService
      .evaluarPropuestaTaller(id, aprobar, this.comentariosTaller[id])
      .subscribe({
        next: () => {
          this.mensaje = aprobar ? 'Taller aprobado.' : 'Taller rechazado.';
          this.procesando = false;
          delete this.comentariosTaller[id];
          delete this.comentarioVisibleTaller[id];
          this.recargarTalleres();
        },
        error: (err: unknown) => {
          this.error = mensajeErrorApi(err, 'No se pudo evaluar la propuesta.');
          this.procesando = false;
        },
      });
  }

  private cargarDatos(): void {
    const uid = this.loginService.getUser()?.id;
    if (!uid) {
      this.error = 'Sesión inválida.';
      this.cargando = false;
      this.cargandoTalleres = false;
      return;
    }
    this.asignacionService.listarPorEvaluador(uid).subscribe({
      next: (items: AsignacionEvaluacion[]) => {
        this.asignaciones = items;
        this.cargando = false;
      },
      error: (err: unknown) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar asignaciones.');
        this.cargando = false;
      },
    });
    this.trabajoService.listarPropuestasTallerPendientes().subscribe({
      next: (items: Trabajo[]) => {
        this.talleresPendientes = items;
        this.cargandoTalleres = false;
      },
      error: (err: unknown) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar propuestas de taller.');
        this.cargandoTalleres = false;
      },
    });
  }

  private recargarAsignaciones(): void {
    const uid = this.loginService.getUser()?.id;
    if (!uid) return;
    this.asignacionService.listarPorEvaluador(uid).subscribe({
      next: (items: AsignacionEvaluacion[]) => (this.asignaciones = items),
    });
  }

  private recargarTalleres(): void {
    this.trabajoService.listarPropuestasTallerPendientes().subscribe({
      next: (items: Trabajo[]) => (this.talleresPendientes = items),
    });
  }
}
