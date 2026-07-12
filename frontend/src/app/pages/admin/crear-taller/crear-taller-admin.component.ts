import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CONGRESS_EVENT_DATES,
  buildCongressDates,
  congressDateLabels,
  isValidTimeRange,
} from '../../../constants/congress-event';
import { Aula } from '../../../models/aula.model';
import { Trabajo } from '../../../models/trabajo.model';
import { ActividadService } from '../../../servicios/actividad.service';
import { AulaService } from '../../../servicios/aula.service';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-crear-taller-admin',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card panel-card form-page">
      <h1>Crear Taller (programa oficial)</h1>
      <p class="muted">
        Fechas permitidas: {{ fechasPermitidas }}. Horarios validados automáticamente.
      </p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="guardar()" class="form-grid form-grid-wide">
        @if (propuestasAprobadas.length) {
          <label class="span-full">
            Vincular propuesta aprobada (opcional)
            <select formControlName="propuestaTallerId" (change)="aplicarPropuesta()">
              <option value="">— Sin vincular —</option>
              @for (p of propuestasAprobadas; track p.id) {
                <option [value]="p.id">{{ p.titulo }}</option>
              }
            </select>
          </label>
        }

        <label class="span-full">
          Título
          <input formControlName="titulo" placeholder="Título del taller" />
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
        <label class="span-full">
          Aula
          <select formControlName="aulaId">
            <option [ngValue]="null">— Elegí un aula —</option>
            @for (a of aulas; track a.id) {
              <option [ngValue]="a.id">
                {{ a.nombre }}{{ a.capacidad ? ' (cap. ' + a.capacidad + ')' : '' }}
              </option>
            }
          </select>
        </label>
        @if (!aulas.length) {
          <p class="muted small span-full">
            No hay aulas activas. Crealas en
            <a routerLink="/admin/congreso">Admin → Congreso → Aulas</a>.
          </p>
        }
        <label class="span-full">
          Responsable(s) / moderación
          <input formControlName="responsables" placeholder="Nombres del equipo o moderador/a" />
        </label>
        <label class="span-full">
          Descripción (opcional)
          <textarea
            formControlName="descripcion"
            rows="4"
            placeholder="Objetivos o detalle para el programa público"
          ></textarea>
        </label>
        <div class="form-actions span-full">
          <button type="submit" class="btn-primary" [disabled]="form.invalid || guardando">
            {{ guardando ? 'Guardando...' : 'Guardar taller' }}
          </button>
          <a routerLink="/admin" class="btn-secundario">Cancelar</a>
        </div>
      </form>
    </section>
  `,
})
export class CrearTallerAdminComponent implements OnInit {
  private fb = inject(FormBuilder);

  fechasCongreso = congressDateLabels();
  fechasPermitidas = CONGRESS_EVENT_DATES.join(', ');
  propuestasAprobadas: Trabajo[] = [];
  aulas: Aula[] = [];
  guardando = false;
  error = '';

  form = this.fb.group({
    titulo: ['', Validators.required],
    fecha: [CONGRESS_EVENT_DATES[0], Validators.required],
    horaInicio: ['09:00', Validators.required],
    horaFin: ['11:00', Validators.required],
    aulaId: [null as number | null, Validators.required],
    responsables: ['', Validators.required],
    descripcion: [''],
    propuestaTallerId: [''],
  });

  constructor(
    private actividadService: ActividadService,
    private trabajoService: TrabajoService,
    private congresoConfigService: CongresoConfigService,
    private aulaService: AulaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.congresoConfigService.obtener().subscribe({
      next: (c) => {
        const dates = buildCongressDates(c.congresoDesde, c.congresoHasta);
        this.fechasCongreso = congressDateLabels(dates);
        this.fechasPermitidas = dates.join(', ');
        this.form.patchValue({ fecha: dates[0] });
      },
    });
    this.aulaService.listarActivas().subscribe({
      next: (items) => (this.aulas = items),
      error: () => (this.aulas = []),
    });
    this.trabajoService
      .listar(1, 100, { tipo: 'PROPUESTA_TALLER', estado: 'APROBADO' })
      .subscribe({
        next: (items) => (this.propuestasAprobadas = items),
        error: () => (this.propuestasAprobadas = []),
      });
  }

  aplicarPropuesta(): void {
    const id = Number(this.form.getRawValue().propuestaTallerId);
    if (!id) return;
    const p = this.propuestasAprobadas.find((x) => x.id === id);
    if (!p) return;
    const partes = [p.resumen, p.metodologia].filter(Boolean);
    this.form.patchValue({
      titulo: p.titulo || this.form.getRawValue().titulo,
      descripcion: partes.join('\n\n') || this.form.getRawValue().descripcion,
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    if (!isValidTimeRange(raw.horaInicio!, raw.horaFin!)) {
      this.error = 'La hora de fin debe ser posterior a la hora de inicio.';
      return;
    }
    this.guardando = true;
    this.error = '';
    const propuestaId = raw.propuestaTallerId ? Number(raw.propuestaTallerId) : undefined;
    this.actividadService
      .crearTallerOficial({
        titulo: raw.titulo!,
        fecha: raw.fecha!,
        horaInicio: raw.horaInicio!,
        horaFin: raw.horaFin!,
        aulaId: Number(raw.aulaId),
        responsables: raw.responsables!,
        descripcion: raw.descripcion || undefined,
        propuestaTallerId: propuestaId,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/admin'], { state: { mensaje: 'El taller quedó cargado en el cronograma.' } });
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo guardar el taller.');
          this.guardando = false;
        },
      });
  }
}
