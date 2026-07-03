import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CONGRESS_EVENT_DATES,
  congressDateLabels,
  isValidTimeRange,
  toLocalDateTime,
} from '../../../constants/congress-event';
import { EJES_TEMATICOS, MODALIDAD_LABELS } from '../../../constants/ejes-tematicos';
import { Trabajo } from '../../../models/trabajo.model';
import { ActividadService } from '../../../servicios/actividad.service';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-sesion-posters-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <section class="card">
      <h1>Crear Sesión de Pósters</h1>
      <p>Programá pósters aprobados en una sesión del cronograma.</p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <form [formGroup]="form" class="form-grid">
        <label>
          Nombre de la sesión
          <input formControlName="titulo" />
        </label>
        <label>
          Ubicación (Hall, Patio, etc.)
          <input formControlName="ubicacion" />
        </label>
        <label>
          Fecha
          <select formControlName="fecha">
            @for (d of fechasCongreso; track d.value) {
              <option [value]="d.value">{{ d.label }}</option>
            }
          </select>
        </label>
        <label>
          Hora inicio
          <input formControlName="horaInicio" type="time" />
        </label>
        <label>
          Hora fin
          <input formControlName="horaFin" type="time" />
        </label>
      </form>

      <div class="filtro-eje box-muted">
        <label>
          Eje temático para filtrar pósters aprobados
          <select [value]="ejeFiltro" (change)="onEjeChange($event)">
            <option value="">Todos los ejes</option>
            @for (eje of ejesTematicos; track eje) {
              <option [value]="eje">{{ eje }}</option>
            }
          </select>
        </label>
        <p class="muted form-hint">
          Al cambiar el eje, se limpia la selección para no mezclar trabajos de distintos ejes.
        </p>
      </div>

      <h2>Seleccionar pósters</h2>
      @if (cargando) {
        <p>Cargando pósters...</p>
      } @else if (trabajosFiltrados.length === 0) {
        <p class="muted">No hay pósters aprobados para el eje seleccionado.</p>
      } @else {
        <div class="lista-checks">
          @for (t of trabajosFiltrados; track t.id) {
            <label class="check-row">
              <input
                type="checkbox"
                [checked]="seleccionados.has(t.id!)"
                (change)="toggleTrabajo(t.id!)"
              />
              <span>
                {{ t.titulo }}
                <span class="muted">({{ t.ejeTematico }})</span>
              </span>
            </label>
          }
        </div>
      }

      <div class="actions">
        <button type="button" class="btn-primary" (click)="crear()" [disabled]="guardando || form.invalid">
          {{ guardando ? 'Creando...' : 'Crear Sesión' }}
        </button>
        <a routerLink="/admin" class="btn-link">Cancelar</a>
      </div>
    </section>
  `,
})
export class SesionPostersAdminComponent implements OnInit {
  private fb = inject(FormBuilder);

  ejesTematicos = [...EJES_TEMATICOS];
  fechasCongreso = congressDateLabels();
  trabajosAprobados: Trabajo[] = [];
  trabajosFiltrados: Trabajo[] = [];
  seleccionados = new Set<number>();
  ejeFiltro = '';
  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';

  form = this.fb.group({
    titulo: ['', Validators.required],
    ubicacion: ['', Validators.required],
    fecha: [CONGRESS_EVENT_DATES[0], Validators.required],
    horaInicio: ['09:00', Validators.required],
    horaFin: ['11:00', Validators.required],
  });

  constructor(
    private trabajoService: TrabajoService,
    private actividadService: ActividadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarTrabajos();
  }

  onEjeChange(event: Event): void {
    this.ejeFiltro = (event.target as HTMLSelectElement).value;
    this.seleccionados.clear();
    this.aplicarFiltro();
  }

  toggleTrabajo(id: number): void {
    if (this.seleccionados.has(id)) {
      this.seleccionados.delete(id);
    } else {
      this.seleccionados.add(id);
    }
  }

  crear(): void {
    if (this.form.invalid) return;
    const ids = [...this.seleccionados];
    if (ids.length === 0) {
      this.error = 'Seleccioná al menos un póster aprobado.';
      return;
    }
    const raw = this.form.getRawValue();
    if (!isValidTimeRange(raw.horaInicio!, raw.horaFin!)) {
      this.error = 'La hora de fin debe ser posterior a la hora de inicio.';
      return;
    }
    this.guardando = true;
    this.error = '';
    this.actividadService
      .crearSesionPosters({
        titulo: raw.titulo!,
        ubicacion: raw.ubicacion!,
        inicio: toLocalDateTime(raw.fecha!, raw.horaInicio!),
        fin: toLocalDateTime(raw.fecha!, raw.horaFin!),
        trabajoIds: ids,
      })
      .subscribe({
        next: () => {
          this.mensaje = 'Sesión de pósters creada correctamente.';
          this.guardando = false;
          this.router.navigate(['/admin']);
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo crear la sesión de pósters.');
          this.guardando = false;
        },
      });
  }

  private cargarTrabajos(): void {
    this.trabajoService.listar(1, 200, { estado: 'APROBADO', modalidad: 'POSTER' }).subscribe({
      next: (items) => {
        this.trabajosAprobados = items;
        this.aplicarFiltro();
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar pósters aprobados.');
        this.cargando = false;
      },
    });
  }

  private aplicarFiltro(): void {
    this.trabajosFiltrados = this.ejeFiltro
      ? this.trabajosAprobados.filter((t) => (t.ejeTematico || '').trim() === this.ejeFiltro)
      : this.trabajosAprobados;
  }
}
