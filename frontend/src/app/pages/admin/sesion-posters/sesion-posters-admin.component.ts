import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { CatalogosCongresoService } from '../../../servicios/catalogos-congreso.service';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { FranjaHorariaService } from '../../../servicios/franja-horaria.service';
import { TrabajoService } from '../../../servicios/trabajo.service';
import {
  aplicarDefaultsAlta,
  guardarUltimaAlta,
} from '../../../utils/actividad-alta-defaults.util';
import { mensajeErrorApi } from '../../../utils/api-error.util';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-sesion-posters-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">🖼</span>
        <div>
          <h1>Crear Sesión de Pósters</h1>
          <p>Paso a paso: datos, horario y pósters del eje</p>
        </div>
      </div>

      <section class="panel-card form-page">
      <p class="muted">
        Paso a paso: primero datos y horario; después elegí pósters del eje.
      </p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }
      @if (hintDefaults) {
        <p class="muted small">{{ hintDefaults }}</p>
      }

      <section class="alta-seccion">
        <h2 class="alta-seccion-titulo">1. Datos y horario</h2>
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
      </section>

      <section class="alta-seccion">
        <div class="alta-seccion-head">
          <h2 class="alta-seccion-titulo">2. Pósters</h2>
          <button type="button" class="btn-link" (click)="trabajosAbiertos = !trabajosAbiertos">
            {{ trabajosAbiertos ? 'Ocultar lista' : 'Mostrar lista' }}
          </button>
        </div>

        @if (trabajosAbiertos) {
          <div class="filtro-eje box-muted">
            <label>
              Eje temático (recomendado)
              <select [value]="ejeFiltro" (change)="onEjeChange($event)">
                <option value="">— Elegí un eje para filtrar —</option>
                @for (eje of ejesTematicos; track eje) {
                  <option [value]="eje">{{ eje }}</option>
                }
              </select>
            </label>
            <label>
              Buscar por título
              <input
                type="search"
                [value]="busqueda"
                (input)="onBusqueda($event)"
                placeholder="Filtrar por título…"
              />
            </label>
            <p class="muted form-hint">
              Sin eje se muestran pocos resultados. Al cambiar el eje se limpia la selección.
              @if (seleccionados.size) {
                · Seleccionados: <strong>{{ seleccionados.size }}</strong>
              }
            </p>
          </div>

          @if (cargando) {
            <p>Cargando pósters...</p>
          } @else if (!ejeFiltro && !busqueda.trim()) {
            <p class="muted dashed-box">
              Elegí un eje temático (o escribí en la búsqueda) para listar pósters aprobados.
            </p>
          } @else if (trabajosVisibles.length === 0) {
            <p class="muted">No hay pósters que coincidan con el filtro.</p>
          } @else {
            <p class="muted small">
              Mostrando {{ trabajosVisibles.length }} de {{ trabajosFiltrados.length }}
            </p>
            <div class="lista-checks">
              @for (t of trabajosVisibles; track t.id) {
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
            @if (trabajosFiltrados.length > limiteLista) {
              <button type="button" class="btn-secundario" (click)="mostrarMas()">
                Mostrar más ({{ trabajosFiltrados.length - limiteLista }} restantes)
              </button>
            }
          }
        } @else {
          <p class="muted small">
            Lista oculta.
            @if (seleccionados.size) {
              Tenés {{ seleccionados.size }} póster(s) seleccionado(s).
            }
          </p>
        }
      </section>

      <div class="actions">
        <button
          type="button"
          class="btn-primary"
          (click)="crear()"
          [disabled]="guardando || form.invalid"
        >
          {{ guardando ? 'Creando...' : 'Crear Sesión' }}
        </button>
        <a routerLink="/admin/congreso/actividades" class="btn-link">Cancelar</a>
      </div>
      </section>

      <p class="panel-volver">
        <a routerLink="/admin/congreso/actividades">← Volver a Actividades</a>
      </p>
    </div>
  `,
})
export class SesionPostersAdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private catalogos = inject(CatalogosCongresoService);

  ejesTematicos: string[] = [];
  fechasCongreso = congressDateLabels();
  fechasOrdenadas = [...CONGRESS_EVENT_DATES];
  aulas: Aula[] = [];
  franjas: FranjaHoraria[] = [];
  franjasDelDia: FranjaHoraria[] = [];
  trabajosAprobados: Trabajo[] = [];
  trabajosFiltrados: Trabajo[] = [];
  seleccionados = new Set<number>();
  ejeFiltro = '';
  busqueda = '';
  limiteLista = PAGE_SIZE;
  trabajosAbiertos = true;
  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';
  hintDefaults = '';
  private defaultsListos = false;

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

  get trabajosVisibles(): Trabajo[] {
    return this.trabajosFiltrados.slice(0, this.limiteLista);
  }

  ngOnInit(): void {
    this.catalogos.ejesActivos().subscribe({
      next: (items) => (this.ejesTematicos = items.map((e) => e.etiqueta || e.codigo)),
      error: () => (this.ejesTematicos = []),
    });
    this.congresoConfigService.obtener().subscribe({
      next: (c) => {
        this.fechasOrdenadas = buildCongressDates(c.congresoDesde, c.congresoHasta);
        this.fechasCongreso = congressDateLabels(this.fechasOrdenadas);
        this.form.patchValue({ fecha: this.fechasOrdenadas[0] });
        this.filtrarFranjas();
        this.intentarAplicarDefaults();
      },
    });
    this.aulaService.listarActivas().subscribe({
      next: (items) => {
        this.aulas = items;
        this.intentarAplicarDefaults();
      },
      error: () => (this.aulas = []),
    });
    this.franjaService.listarActivas().subscribe({
      next: (items) => {
        this.franjas = items;
        this.filtrarFranjas();
        this.intentarAplicarDefaults();
      },
      error: () => (this.franjas = []),
    });
    this.cargarTrabajos();
  }

  onFechaChange(): void {
    this.form.patchValue({ franjaId: null });
    this.filtrarFranjas();
    const franjas = this.franjasDelDia.map((f) => f.id!).filter((id) => id != null);
    if (franjas.length) {
      this.form.patchValue({ franjaId: franjas[0] });
    }
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
    this.limiteLista = PAGE_SIZE;
    this.aplicarFiltro();
  }

  onBusqueda(event: Event): void {
    this.busqueda = (event.target as HTMLInputElement).value;
    this.limiteLista = PAGE_SIZE;
    this.aplicarFiltro();
  }

  mostrarMas(): void {
    this.limiteLista += PAGE_SIZE;
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
      this.trabajosAbiertos = true;
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
          guardarUltimaAlta({
            tipo: 'POSTER',
            aulaId: Number(raw.aulaId),
            fecha: raw.fecha,
            franjaId: Number(raw.franjaId),
          });
          this.mensaje = 'Sesión de pósters creada correctamente.';
          this.guardando = false;
          this.router.navigate(['/admin/congreso/programa']);
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
    const q = this.busqueda.trim().toLowerCase();
    let list = this.trabajosAprobados;
    if (this.ejeFiltro) {
      list = list.filter((t) => (t.ejeTematico || '').trim() === this.ejeFiltro);
    }
    if (q) {
      list = list.filter((t) => (t.titulo || '').toLowerCase().includes(q));
    }
    if (!this.ejeFiltro && !q) {
      this.trabajosFiltrados = [];
      return;
    }
    this.trabajosFiltrados = list;
  }

  private intentarAplicarDefaults(): void {
    if (this.defaultsListos) return;
    if (!this.fechasOrdenadas.length || !this.franjas.length) return;
    const defs = aplicarDefaultsAlta('POSTER', {
      fechas: this.fechasOrdenadas,
      aulaIds: this.aulas.map((a) => a.id!).filter((id) => id != null),
      franjaIdsDelDia: (fecha) => {
        const dia = diaCongresoDeFecha(fecha, this.fechasOrdenadas);
        return this.franjas
          .filter((f) => f.diaCongreso === dia && f.activa !== false && f.id != null)
          .map((f) => f.id!);
      },
    });
    this.filtrarFranjas();
    const patch: { fecha?: string; aulaId?: number | null; franjaId?: number | null } = {};
    if (defs.fecha) patch.fecha = defs.fecha;
    if (defs.aulaId != null) patch.aulaId = defs.aulaId;
    this.form.patchValue(patch);
    this.filtrarFranjas();
    if (defs.franjaId != null) {
      this.form.patchValue({ franjaId: defs.franjaId });
    } else if (this.franjasDelDia[0]?.id != null) {
      this.form.patchValue({ franjaId: this.franjasDelDia[0].id });
    }
    if (defs.aulaId != null || defs.franjaId != null) {
      this.hintDefaults = 'Se precargó aula/horario de la última sesión de pósters que creaste.';
    }
    this.defaultsListos = true;
  }
}
