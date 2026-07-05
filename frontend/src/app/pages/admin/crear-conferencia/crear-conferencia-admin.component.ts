import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CONGRESS_EVENT_DATES,
  congressDateLabels,
  isValidTimeRange,
} from '../../../constants/congress-event';
import { ActividadService } from '../../../servicios/actividad.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-crear-conferencia-admin',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card panel-card form-page">
      <h1>Crear Conferencia (programa oficial)</h1>
      <p class="muted">
        Fechas permitidas: {{ fechasPermitidas }}. Horarios validados automáticamente.
      </p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="guardar()" class="form-grid form-grid-wide">
        <label class="span-full">
          Título
          <input formControlName="titulo" placeholder="Título de la conferencia" />
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
          Lugar / espacio
          <input formControlName="sala" placeholder="Ej. Aula Magna — FCAyF" />
        </label>
        <label class="span-full">
          Conferencista(s)
          <input formControlName="conferencistas" placeholder="Nombre(s) y apellido(s)" />
        </label>
        <label>
          Moderador/a (opcional)
          <input formControlName="moderador" placeholder="Nombre" />
        </label>
        <label>
          Institución (opcional)
          <input formControlName="institucion" placeholder="UNLP, INTA, etc." />
        </label>
        <label class="span-full">
          Descripción / resumen (opcional)
          <textarea
            formControlName="descripcion"
            rows="4"
            placeholder="Detalle para mostrar en el programa"
          ></textarea>
        </label>
        <div class="form-actions span-full">
          <button type="submit" class="btn-primary" [disabled]="form.invalid || guardando">
            {{ guardando ? 'Guardando...' : 'Guardar conferencia' }}
          </button>
          <a routerLink="/admin" class="btn-secundario">Cancelar</a>
        </div>
      </form>
    </section>
  `,
})
export class CrearConferenciaAdminComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  readonly fechasCongreso = congressDateLabels();
  readonly fechasPermitidas = CONGRESS_EVENT_DATES.join(', ');
  guardando = false;
  error = '';

  form = this.fb.group({
    titulo: ['', Validators.required],
    fecha: [CONGRESS_EVENT_DATES[0], Validators.required],
    horaInicio: ['09:00', Validators.required],
    horaFin: ['10:00', Validators.required],
    sala: ['', Validators.required],
    conferencistas: ['', Validators.required],
    moderador: [''],
    institucion: [''],
    descripcion: [''],
  });

  constructor(private actividadService: ActividadService) {}

  guardar(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    if (!isValidTimeRange(raw.horaInicio!, raw.horaFin!)) {
      this.error = 'La hora de fin debe ser posterior a la hora de inicio.';
      return;
    }
    this.guardando = true;
    this.error = '';
    this.actividadService
      .crearConferencia({
        titulo: raw.titulo!,
        fecha: raw.fecha!,
        horaInicio: raw.horaInicio!,
        horaFin: raw.horaFin!,
        sala: raw.sala!,
        conferencistas: raw.conferencistas!,
        moderador: raw.moderador || undefined,
        institucion: raw.institucion || undefined,
        descripcion: raw.descripcion || undefined,
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/admin'], {
            state: { mensaje: 'La conferencia quedó cargada en el cronograma.' },
          });
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo guardar la conferencia.');
          this.guardando = false;
        },
      });
  }
}
