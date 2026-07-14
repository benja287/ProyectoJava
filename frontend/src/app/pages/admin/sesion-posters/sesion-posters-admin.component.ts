import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CONGRESS_EVENT_DATES,
  buildCongressDates,
  congressDateLabels,
} from '../../../constants/congress-event';
import { EJES_TEMATICOS, MODALIDAD_LABELS } from '../../../constants/ejes-tematicos';
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
          Ubicación / Aula
          <select formControlName="aulaId">
            <option [ngValue]="null">— Elegí un aula —</option>
            @for (a of aulas; track a.id) {
              <option [ngValue]="a.id">
                {{ a.nombre }}{{ a.capacidad ? ' (cap. ' + a.capacidad + ')' : '' }}
              </option>
            }
          </select>
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
      </form>

      @if (!franjasDelDia.length) {
        <p class="muted">
          No hay franjas para ese día.
          <a routerLink="/admin/congreso/franjas">Configurar franjas</a>.
        </p>
      }

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
  fechasOrdenadas = [...CONGRESS_EVENT_DATES];
  aulas: Aula[] = [];
  franjas: FranjaHoraria[] = [];
  franjasDelDia: FranjaHoraria[] = [];
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
    aulaId: [null as number | null, Validators.required],
    fecha: [CONGRESS_EVENT_DATES[0], Validators.required],
    franjaId: [null as number | null, Validators.required],
  });

  constructor(
    private trabajoService: TrabajoService,
    private actividadService: ActividadService,
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
    this.cargarTrabajos();
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
    this.guardando = true;
    this.error = '';
    this.actividadService
      .crearSesionPosters({
        titulo: raw.titulo!,
        aulaId: Number(raw.aulaId),
        franjaId: Number(raw.franjaId),
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
    this.trabajoService.listarAprobadosProgramables('POSTER').subscribe({
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
