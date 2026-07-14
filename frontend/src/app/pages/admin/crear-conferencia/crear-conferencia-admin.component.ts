import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CONGRESS_EVENT_DATES,
  buildCongressDates,
  congressDateLabels,
} from '../../../constants/congress-event';
import { Aula } from '../../../models/aula.model';
import {
  FranjaHoraria,
  diaCongresoDeFecha,
  etiquetaFranja,
} from '../../../models/franja-horaria.model';
import { ActividadService } from '../../../servicios/actividad.service';
import { AulaService } from '../../../servicios/aula.service';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { FranjaHorariaService } from '../../../servicios/franja-horaria.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-crear-conferencia-admin',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card panel-card form-page">
      <h1>Crear Conferencia (programa oficial)</h1>
      <p class="muted">Fechas permitidas: {{ fechasPermitidas }}. Elegí día y franja horaria.</p>

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
          <select formControlName="fecha" (change)="onFechaChange()">
            @for (d of fechasCongreso; track d.value) {
              <option [value]="d.value">{{ d.label }}</option>
            }
          </select>
        </label>
        <label>
          Franja horaria
          <select formControlName="franjaId">
            <option [ngValue]="null">— Elegí una franja —</option>
            @for (f of franjasDelDia; track f.id) {
              <option [ngValue]="f.id">{{ labelFranja(f) }}</option>
            }
          </select>
        </label>
        @if (!franjasDelDia.length) {
          <p class="muted small span-full">
            No hay franjas para ese día.
            <a routerLink="/admin/congreso/franjas">Configurar franjas</a>.
          </p>
        }
        <label class="span-full">
          Aula
          <select formControlName="aulaId">
            <option [ngValue]="null">— Elegí un aula —</option>
            @for (a of aulas; track a.id) {
              <option [ngValue]="a.id">
                {{ a.nombre }}{{ a.capacidad != null ? ' (cap. ' + a.capacidad + ')' : '' }}
              </option>
            }
          </select>
        </label>
        @if (!aulas.length) {
          <p class="muted small span-full">
            No hay aulas activas. Crealas en
            <a routerLink="/admin/congreso/aulas">Admin → Congreso → Aulas</a>.
          </p>
        }
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
          <a routerLink="/admin/congreso/actividades" class="btn-secundario">Cancelar</a>
        </div>
      </form>
    </section>
  `,
})
export class CrearConferenciaAdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  fechasCongreso = congressDateLabels();
  fechasOrdenadas = [...CONGRESS_EVENT_DATES];
  fechasPermitidas = CONGRESS_EVENT_DATES.join(', ');
  aulas: Aula[] = [];
  franjas: FranjaHoraria[] = [];
  franjasDelDia: FranjaHoraria[] = [];
  guardando = false;
  error = '';

  form = this.fb.group({
    titulo: ['', Validators.required],
    fecha: [CONGRESS_EVENT_DATES[0], Validators.required],
    franjaId: [null as number | null, Validators.required],
    aulaId: [null as number | null, Validators.required],
    conferencistas: ['', Validators.required],
    moderador: [''],
    institucion: [''],
    descripcion: [''],
  });

  constructor(
    private actividadService: ActividadService,
    private congresoConfigService: CongresoConfigService,
    private aulaService: AulaService,
    private franjaService: FranjaHorariaService
  ) {}

  ngOnInit(): void {
    this.congresoConfigService.obtener().subscribe({
      next: (c) => {
        this.fechasOrdenadas = buildCongressDates(c.congresoDesde, c.congresoHasta);
        this.fechasCongreso = congressDateLabels(this.fechasOrdenadas);
        this.fechasPermitidas = this.fechasOrdenadas.join(', ');
        this.form.patchValue({ fecha: this.fechasOrdenadas[0] });
        this.filtrarFranjas();
      },
    });
    this.aulaService.listarActivas().subscribe({
      next: (items) => (this.aulas = items),
      error: () => (this.aulas = []),
    });
    this.franjaService.listarActivas().subscribe({
      next: (items) => {
        this.franjas = items;
        this.filtrarFranjas();
      },
      error: () => (this.franjas = []),
    });
  }

  onFechaChange(): void {
    this.form.patchValue({ franjaId: null });
    this.filtrarFranjas();
  }

  filtrarFranjas(): void {
    const fecha = this.form.getRawValue().fecha;
    const dia = fecha ? diaCongresoDeFecha(fecha, this.fechasOrdenadas) : null;
    this.franjasDelDia =
      dia == null ? [] : this.franjas.filter((f) => f.diaCongreso === dia && f.activa !== false);
  }

  labelFranja(f: FranjaHoraria): string {
    return etiquetaFranja(f);
  }

  guardar(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    this.guardando = true;
    this.error = '';
    this.actividadService
      .crearConferencia({
        titulo: raw.titulo!,
        aulaId: Number(raw.aulaId),
        franjaId: Number(raw.franjaId),
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
