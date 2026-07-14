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
import { Trabajo } from '../../../models/trabajo.model';
import { ActividadService } from '../../../servicios/actividad.service';
import { AulaService } from '../../../servicios/aula.service';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { FranjaHorariaService } from '../../../servicios/franja-horaria.service';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-crear-taller-admin',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card panel-card form-page">
      <h1>Crear Taller (programa oficial)</h1>
      <p class="muted">Fechas permitidas: {{ fechasPermitidas }}. Elegí día y franja horaria.</p>

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
  fechasOrdenadas = [...CONGRESS_EVENT_DATES];
  fechasPermitidas = CONGRESS_EVENT_DATES.join(', ');
  propuestasAprobadas: Trabajo[] = [];
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
    responsables: ['', Validators.required],
    descripcion: [''],
    propuestaTallerId: [''],
  });

  constructor(
    private actividadService: ActividadService,
    private trabajoService: TrabajoService,
    private congresoConfigService: CongresoConfigService,
    private aulaService: AulaService,
    private franjaService: FranjaHorariaService,
    private router: Router
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
    this.trabajoService
      .listar(1, 100, { tipo: 'PROPUESTA_TALLER', estado: 'APROBADO' })
      .subscribe({
        next: (items) => (this.propuestasAprobadas = items),
        error: () => (this.propuestasAprobadas = []),
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
    this.guardando = true;
    this.error = '';
    const propuestaId = raw.propuestaTallerId ? Number(raw.propuestaTallerId) : undefined;
    this.actividadService
      .crearTallerOficial({
        titulo: raw.titulo!,
        aulaId: Number(raw.aulaId),
        franjaId: Number(raw.franjaId),
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
