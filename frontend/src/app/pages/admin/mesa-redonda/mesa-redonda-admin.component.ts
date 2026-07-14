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
  selector: 'app-mesa-redonda-admin',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="card panel-card form-page">
      <h1>Crear Mesa Redonda</h1>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="guardar()" class="form-grid form-grid-wide">
        <label>
          Título
          <input formControlName="titulo" placeholder="Título" />
        </label>
        <label>
          Eje temático
          <input formControlName="ejeTematico" placeholder="Eje temático" />
        </label>
        <label>
          Moderador
          <input formControlName="moderador" placeholder="Moderador" />
        </label>
        <label class="span-full">
          Panelistas (separados por coma)
          <input formControlName="panelistas" placeholder="Panelistas (separados por coma)" />
        </label>
        <label class="span-full">
          Descripción
          <textarea formControlName="descripcion" rows="4" placeholder="Descripción"></textarea>
        </label>
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
        <div class="form-actions span-full">
          <button type="submit" class="btn-primary" [disabled]="form.invalid || guardando">
            {{ guardando ? 'Guardando...' : 'Crear Mesa Redonda' }}
          </button>
          <a routerLink="/admin/congreso/actividades" class="btn-secundario">Cancelar</a>
        </div>
      </form>
    </section>
  `,
})
export class MesaRedondaAdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  fechasCongreso = congressDateLabels();
  fechasOrdenadas = [...CONGRESS_EVENT_DATES];
  aulas: Aula[] = [];
  franjas: FranjaHoraria[] = [];
  franjasDelDia: FranjaHoraria[] = [];
  guardando = false;
  error = '';

  form = this.fb.group({
    titulo: ['', Validators.required],
    ejeTematico: [''],
    moderador: ['', Validators.required],
    panelistas: [''],
    descripcion: [''],
    aulaId: [null as number | null, Validators.required],
    fecha: [CONGRESS_EVENT_DATES[0], Validators.required],
    franjaId: [null as number | null, Validators.required],
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
      .crearMesaRedonda({
        titulo: raw.titulo!,
        ejeTematico: raw.ejeTematico || undefined,
        moderador: raw.moderador!,
        panelistas: raw.panelistas || undefined,
        descripcion: raw.descripcion || undefined,
        aulaId: Number(raw.aulaId),
        franjaId: Number(raw.franjaId),
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/admin'], { state: { mensaje: 'Mesa redonda creada correctamente.' } });
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo crear la mesa redonda.');
          this.guardando = false;
        },
      });
  }
}
