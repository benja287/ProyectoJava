import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActividadCronograma } from '../../../models/actividad.model';
import { Aula } from '../../../models/aula.model';
import { MODALIDAD_LABELS } from '../../../constants/ejes-tematicos';
import { ActividadService } from '../../../servicios/actividad.service';
import { AulaService } from '../../../servicios/aula.service';
import { formatFechaActividad } from '../../../utils/fecha.util';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { AulaUbicacionLinkComponent } from '../../../components/aula-mapa/aula-ubicacion-link.component';

const ETIQUETAS_TIPO: Record<string, string> = {
  MESA_TEMATICA: 'Mesa temática',
  MESA_REDONDA: 'Mesa redonda',
  POSTER: 'Sesión de pósters',
  TALLER: 'Taller',
  CONFERENCIA: 'Conferencia',
};

const ORDEN_TIPO: Record<string, number> = {
  MESA_TEMATICA: 1,
  MESA_REDONDA: 2,
  POSTER: 3,
  TALLER: 4,
  CONFERENCIA: 5,
};

type ConfirmDelete = { id: number; titulo: string; tipo: string; conTrabajos: boolean };

@Component({
  selector: 'app-cronograma-congreso-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AulaUbicacionLinkComponent],
  template: `
    @if (error) {
      <p class="error">{{ error }}</p>
    }
    @if (feedback) {
      <p class="ok">{{ feedback }}</p>
    }

    @if (cargando) {
      <p class="muted">Cargando cronograma...</p>
    } @else if (!actividades.length) {
      <p class="muted dashed-box">No hay actividades cargadas en el cronograma.</p>
    } @else {
      @for (fecha of fechasOrdenadas; track fecha) {
        <div class="cronograma-dia-grupo">
          <h3 class="cronograma-dia-titulo">📅 {{ etiquetaFecha(fecha) }}</h3>
          <div class="cronograma-dia-items">
            @for (a of actividadesPorFecha(fecha); track a.id) {
              <article class="cronograma-item" [class]="claseTipo(a.tipoActividad)">
                <div class="cronograma-item-top">
                  <div>
                    <p class="cronograma-item-tipo">{{ etiquetaTipo(a.tipoActividad) }}</p>
                    <h4 class="cronograma-item-titulo">
                      @if (a.codigo && a.tipoActividad === 'MESA_TEMATICA') {
                        {{ a.codigo }} —
                      }
                      {{ a.titulo }}
                    </h4>
                    <p class="muted small cronograma-item-horario">
                      🕒 {{ hora(a.inicio) }} – {{ hora(a.fin) }}
                      @if (a.sala || a.aulaId) {
                        |
                        <app-aula-ubicacion-link
                          [aula]="aulaDe(a)"
                          [aulaId]="a.aulaId ?? null"
                          [sala]="a.sala || ''"
                          [modoAdmin]="true"
                        />
                      } @else {
                        | 📍 —
                      }
                    </p>
                    @if (a.tipoActividad === 'MESA_REDONDA') {
                      <p class="small"><strong>Moderador:</strong> {{ a.moderador || '—' }}</p>
                      @if (a.panelistas) {
                        <p class="small"><strong>Panelistas:</strong> {{ a.panelistas }}</p>
                      }
                      @if (a.descripcion) {
                        <p class="muted small">{{ a.descripcion }}</p>
                      }
                    }
                    @if (a.tipoActividad === 'TALLER' && a.responsables) {
                      <p class="small"><strong>Responsable(s):</strong> {{ a.responsables }}</p>
                      @if (a.descripcion) {
                        <p class="muted small italic">{{ a.descripcion }}</p>
                      }
                    }
                    @if (a.tipoActividad === 'CONFERENCIA') {
                      <p class="small"><strong>Conferencista(s):</strong> {{ a.conferencistas || '—' }}</p>
                      @if (a.moderador) {
                        <p class="small"><strong>Moderación:</strong> {{ a.moderador }}</p>
                      }
                      @if (a.institucion) {
                        <p class="small"><strong>Institución:</strong> {{ a.institucion }}</p>
                      }
                      @if (a.descripcion) {
                        <p class="muted small italic">{{ a.descripcion }}</p>
                      }
                    }
                  </div>
                  <div class="cronograma-item-acciones">
                    <button type="button" class="btn-secundario btn-sm" (click)="abrirEdicion(a)">
                      Editar
                    </button>
                    <button
                      type="button"
                      class="btn-link danger btn-sm"
                      [disabled]="procesandoId === a.id"
                      (click)="pedirEliminar(a)"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                @if (a.trabajos?.length && (a.tipoActividad === 'MESA_TEMATICA' || a.tipoActividad === 'POSTER')) {
                  <ul class="cronograma-trabajos-lista">
                    @for (t of a.trabajos; track t.id; let i = $index) {
                      <li>
                        <div class="cronograma-trabajo-row">
                          <div>
                            @if (a.tipoActividad === 'MESA_TEMATICA') {
                              <span class="cronograma-trabajo-titulo">{{ i + 1 }}. {{ t.titulo }}</span>
                            } @else {
                              <span class="cronograma-trabajo-titulo">{{ t.titulo }}</span>
                            }
                            <p class="muted small">
                              Autor: {{ nombreAutor(t) }} | Eje: {{ t.ejeTematico || '—' }} |
                              {{ etiquetaTipoTrabajo(t.tipo) }} — {{ etiquetaModalidad(t.modalidad) }}
                            </p>
                          </div>
                          <button
                            type="button"
                            class="btn-quitar-trabajo"
                            [disabled]="procesandoQuitar === t.id"
                            (click)="quitarTrabajo(a.id!, t.id)"
                          >
                            Quitar
                          </button>
                        </div>
                      </li>
                    }
                  </ul>
                }
              </article>
            }
          </div>
        </div>
      }
    }

    @if (confirmDelete) {
      <div class="modal-overlay" (click)="confirmDelete = null">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h3>Confirmar eliminación</h3>
          <p>
            ¿Eliminar <strong>{{ confirmDelete.titulo }}</strong>?
          </p>
          @if (confirmDelete.conTrabajos) {
            <p class="notice-box notice-box--amber">
              Los trabajos asignados volverán al estado <strong>aprobado</strong>.
            </p>
          }
          <div class="modal-actions">
            <button type="button" class="btn-secundario" (click)="confirmDelete = null">Cancelar</button>
            <button type="button" class="btn-link danger" (click)="eliminarConfirmado()">Eliminar</button>
          </div>
        </div>
      </div>
    }

    @if (editando) {
      <div class="modal-overlay" (click)="cerrarEdicion()">
        <div class="modal-card modal-card--wide" (click)="$event.stopPropagation()">
          <h3>Editar {{ etiquetaTipo(editando.tipoActividad) }}</h3>
          <form [formGroup]="editForm" (ngSubmit)="guardarEdicion()" class="form-grid">
            @if (editando.tipoActividad === 'MESA_TEMATICA') {
              <label>
                Código
                <input formControlName="codigo" />
              </label>
            }
            <label class="span-2">
              Título / descripción
              <input formControlName="titulo" />
            </label>
            <label>
              Sala
              <input formControlName="sala" />
            </label>
            <label>
              Inicio
              <input formControlName="inicio" type="datetime-local" />
            </label>
            <label>
              Fin
              <input formControlName="fin" type="datetime-local" />
            </label>
            @if (editando.tipoActividad === 'MESA_REDONDA') {
              <label>
                Moderador
                <input formControlName="moderador" />
              </label>
              <label class="span-2">
                Panelistas
                <input formControlName="panelistas" />
              </label>
              <label class="span-2">
                Descripción
                <textarea formControlName="descripcion" rows="2"></textarea>
              </label>
            }
            @if (editando.tipoActividad === 'TALLER') {
              <label class="span-2">
                Responsable(s)
                <input formControlName="responsables" />
              </label>
              <label class="span-2">
                Descripción
                <textarea formControlName="descripcion" rows="2"></textarea>
              </label>
            }
            @if (editando.tipoActividad === 'CONFERENCIA') {
              <label class="span-2">
                Conferencista(s)
                <input formControlName="conferencistas" />
              </label>
              <label>
                Moderación
                <input formControlName="moderador" />
              </label>
              <label>
                Institución
                <input formControlName="institucion" />
              </label>
              <label class="span-2">
                Descripción
                <textarea formControlName="descripcion" rows="2"></textarea>
              </label>
            }
            <div class="modal-actions span-2">
              <button type="button" class="btn-secundario" (click)="cerrarEdicion()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="editForm.invalid || guardandoEdicion">
                {{ guardandoEdicion ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class CronogramaCongresoAdminComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Output() cambio = new EventEmitter<void>();

  actividades: ActividadCronograma[] = [];
  aulasPorId = new Map<number, Aula>();
  cargando = true;
  error = '';
  feedback = '';
  procesandoId?: number;
  procesandoQuitar?: number;
  confirmDelete: ConfirmDelete | null = null;
  editando?: ActividadCronograma;
  guardandoEdicion = false;

  editForm = this.fb.group({
    titulo: ['', Validators.required],
    sala: ['', Validators.required],
    inicio: ['', Validators.required],
    fin: ['', Validators.required],
    codigo: [''],
    descripcion: [''],
    moderador: [''],
    panelistas: [''],
    responsables: [''],
    conferencistas: [''],
    institucion: [''],
  });

  constructor(
    private actividadService: ActividadService,
    private aulaService: AulaService
  ) {}

  ngOnInit(): void {
    this.aulaService.listarAdmin().subscribe({
      next: (items) => {
        this.aulasPorId = new Map(items.filter((a) => a.id != null).map((a) => [a.id!, a]));
      },
      error: () => (this.aulasPorId = new Map()),
    });
    this.cargar();
  }

  aulaDe(a: ActividadCronograma): Aula | null {
    if (a.aulaId == null) {
      return null;
    }
    return this.aulasPorId.get(a.aulaId) ?? null;
  }

  recargar(): void {
    this.cargar();
  }

  get fechasOrdenadas(): string[] {
    const fechas = new Set(this.actividades.map((a) => this.fechaKey(a.inicio)));
    return [...fechas].sort();
  }

  actividadesPorFecha(fecha: string): ActividadCronograma[] {
    return this.actividades
      .filter((a) => this.fechaKey(a.inicio) === fecha)
      .sort((x, y) => this.compararActividades(x, y));
  }

  etiquetaTipo(tipo?: string): string {
    return tipo ? ETIQUETAS_TIPO[tipo] ?? tipo : 'Actividad';
  }

  claseTipo(tipo?: string): string {
    const map: Record<string, string> = {
      MESA_TEMATICA: 'cronograma-item--mesa',
      MESA_REDONDA: 'cronograma-item--redonda',
      POSTER: 'cronograma-item--poster',
      TALLER: 'cronograma-item--taller',
      CONFERENCIA: 'cronograma-item--conferencia',
    };
    return map[tipo ?? ''] ?? '';
  }

  etiquetaFecha(fechaIso: string): string {
    const d = new Date(`${fechaIso}T12:00:00`);
    return d.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  hora(valor?: string): string {
    const s = formatFechaActividad(valor);
    const part = s.split(' ')[1];
    return part ? part.slice(0, 5) : '—';
  }

  nombreAutor(t: { autorNombre?: string; autorApellido?: string }): string {
    const n = `${t.autorNombre ?? ''} ${t.autorApellido ?? ''}`.trim();
    return n || '—';
  }

  etiquetaTipoTrabajo(tipo?: string): string {
    if (tipo === 'TRABAJO_CIENTIFICO') return 'Científico';
    if (tipo === 'RELATO_DE_EXPERIENCIA') return 'Relato de experiencia';
    return '—';
  }

  etiquetaModalidad(modalidad?: string): string {
    if (!modalidad) return '—';
    return MODALIDAD_LABELS[modalidad as keyof typeof MODALIDAD_LABELS] ?? modalidad;
  }

  abrirEdicion(a: ActividadCronograma): void {
    this.editando = a;
    this.editForm.patchValue({
      titulo: a.titulo,
      sala: a.sala ?? '',
      inicio: this.toLocalInput(a.inicio),
      fin: this.toLocalInput(a.fin),
      codigo: a.codigo ?? '',
      descripcion: a.descripcion ?? '',
      moderador: a.moderador ?? '',
      panelistas: a.panelistas ?? '',
      responsables: a.responsables ?? '',
      conferencistas: a.conferencistas ?? '',
      institucion: a.institucion ?? '',
    });
  }

  cerrarEdicion(): void {
    this.editando = undefined;
  }

  guardarEdicion(): void {
    if (!this.editando?.id || this.editForm.invalid) return;
    const raw = this.editForm.getRawValue();
    const inicio = this.fromLocalInput(raw.inicio!);
    const fin = this.fromLocalInput(raw.fin!);
    if (fin <= inicio) {
      this.error = 'La hora de fin debe ser posterior al inicio.';
      return;
    }
    this.guardandoEdicion = true;
    this.error = '';
    this.actividadService
      .actualizarPrograma(this.editando.id, {
        titulo: raw.titulo ?? undefined,
        sala: raw.sala ?? undefined,
        inicio,
        fin,
        codigo: raw.codigo || undefined,
        descripcion: raw.descripcion || undefined,
        moderador: raw.moderador || undefined,
        panelistas: raw.panelistas || undefined,
        responsables: raw.responsables || undefined,
        conferencistas: raw.conferencistas || undefined,
        institucion: raw.institucion || undefined,
      })
      .subscribe({
        next: () => {
          this.feedback = 'Actividad actualizada.';
          this.guardandoEdicion = false;
          this.cerrarEdicion();
          this.cargar();
          this.cambio.emit();
        },
        error: (err: unknown) => {
          this.error = mensajeErrorApi(err, 'No se pudo actualizar la actividad.');
          this.guardandoEdicion = false;
        },
      });
  }

  pedirEliminar(a: ActividadCronograma): void {
    const conTrabajos =
      (a.tipoActividad === 'MESA_TEMATICA' || a.tipoActividad === 'POSTER') &&
      (a.trabajos?.length ?? 0) > 0;
    this.confirmDelete = {
      id: a.id!,
      titulo: a.codigo ? `${a.codigo} — ${a.titulo}` : a.titulo,
      tipo: a.tipoActividad,
      conTrabajos,
    };
  }

  eliminarConfirmado(): void {
    if (!this.confirmDelete) return;
    const id = this.confirmDelete.id;
    this.procesandoId = id;
    this.error = '';
    this.actividadService.baja(id).subscribe({
      next: () => {
        this.feedback = 'Actividad eliminada del cronograma.';
        this.confirmDelete = null;
        this.procesandoId = undefined;
        this.cargar();
        this.cambio.emit();
      },
      error: (err: unknown) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar la actividad.');
        this.procesandoId = undefined;
      },
    });
  }

  quitarTrabajo(actividadId: number, trabajoId: number): void {
    this.procesandoQuitar = trabajoId;
    this.error = '';
    this.actividadService.quitarTrabajo(actividadId, trabajoId).subscribe({
      next: () => {
        this.feedback = 'Trabajo quitado de la actividad.';
        this.procesandoQuitar = undefined;
        this.cargar();
        this.cambio.emit();
      },
      error: (err: unknown) => {
        this.error = mensajeErrorApi(err, 'No se pudo quitar el trabajo.');
        this.procesandoQuitar = undefined;
      },
    });
  }

  private cargar(): void {
    this.cargando = true;
    this.actividadService.listarCronograma().subscribe({
      next: (items: ActividadCronograma[]) => {
        this.actividades = items;
        this.cargando = false;
      },
      error: (err: unknown) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar el cronograma.');
        this.cargando = false;
      },
    });
  }

  private fechaKey(inicio?: string): string {
    if (!inicio) return '';
    const s = formatFechaActividad(inicio);
    return s.split(' ')[0] ?? '';
  }

  private compararActividades(a: ActividadCronograma, b: ActividadCronograma): number {
    const ha = this.hora(a.inicio);
    const hb = this.hora(b.inicio);
    const cmpHora = ha.localeCompare(hb);
    if (cmpHora !== 0) return cmpHora;
    const oa = ORDEN_TIPO[a.tipoActividad] ?? 99;
    const ob = ORDEN_TIPO[b.tipoActividad] ?? 99;
    return oa - ob;
  }

  private toLocalInput(iso?: string): string {
    if (!iso) return '';
    const normalized = iso.replace(' ', 'T').slice(0, 19);
    return normalized.length >= 16 ? normalized.slice(0, 16) : normalized;
  }

  private fromLocalInput(local: string): string {
    return local.length === 16 ? `${local}:00` : local;
  }
}
