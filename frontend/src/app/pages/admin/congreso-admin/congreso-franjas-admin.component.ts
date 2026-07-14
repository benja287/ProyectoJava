import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  CongresoConfig,
  jornadaEfectiva,
} from '../../../models/congreso-config.model';
import { FranjaHoraria } from '../../../models/franja-horaria.model';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { FranjaHorariaService } from '../../../servicios/franja-horaria.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

const SNAP_MIN = 15;
const PX_POR_MIN = 1.35;

type DiaCongreso = 1 | 2 | 3;

interface HuecoLibre {
  inicio: string;
  fin: string;
}

@Component({
  selector: 'app-congreso-franjas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">⏱</span>
        <div>
          <h1>Franjas horarias</h1>
          <p>Definí la jornada y creá bloques arrastrando sobre el tiempo libre</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin/congreso">← Volver a Congreso</a></p>

      @if (feedback) {
        <p [class]="feedbackOk ? 'ok' : 'error'">{{ feedback }}</p>
      }

      <section class="panel-card">
        <h2>1. Horario de actividades (jornada)</h2>
        <p class="muted">
          Primero el rango en el que puede haber actividades. Podés dejar un horario común o
          personalizar cada día.
        </p>
        <div class="form-grid form-grid-wide">
          <label>
            Inicio (común)
            <input type="time" [(ngModel)]="jornada.inicio" [ngModelOptions]="{ standalone: true }" />
          </label>
          <label>
            Fin (común)
            <input type="time" [(ngModel)]="jornada.fin" [ngModelOptions]="{ standalone: true }" />
          </label>
        </div>
        <label class="check-row">
          <input type="checkbox" [(ngModel)]="usarOverride" [ngModelOptions]="{ standalone: true }" />
          Personalizar jornada por día
        </label>
        @if (usarOverride) {
          <div class="override-grid">
            @for (d of dias; track d) {
              <fieldset class="override-dia">
                <legend>Día {{ d }}</legend>
                <label>
                  Inicio
                  <input
                    type="time"
                    [(ngModel)]="overrideIni[d]"
                    [ngModelOptions]="{ standalone: true }"
                    [placeholder]="jornada.inicio"
                  />
                </label>
                <label>
                  Fin
                  <input
                    type="time"
                    [(ngModel)]="overrideFin[d]"
                    [ngModelOptions]="{ standalone: true }"
                    [placeholder]="jornada.fin"
                  />
                </label>
                <button type="button" class="btn-link" (click)="limpiarOverride(d)">Usar común</button>
              </fieldset>
            }
          </div>
        }
        <div class="inline-form-row" style="margin-top: 0.75rem">
          <button type="button" class="btn-primary" [disabled]="guardandoJornada" (click)="guardarJornada()">
            {{ guardandoJornada ? 'Guardando...' : 'Guardar jornada' }}
          </button>
        </div>
      </section>

      <section class="panel-card" style="margin-top: 1.25rem">
        <h2>2. Franjas del día</h2>
        <p class="muted">
          Arrastrá sobre una zona libre (verde) para crear una franja. Tocá una franja ocupada para
          editarla.
        </p>

        <div class="dia-tabs" role="tablist">
          @for (d of dias; track d) {
            <button
              type="button"
              class="dia-tab"
              [class.dia-tab--activo]="diaActivo === d"
              (click)="seleccionarDia(d)"
            >
              Día {{ d }}
              <span class="dia-tab-meta">{{ jornadaDelDia(d).inicio }}–{{ jornadaDelDia(d).fin }}</span>
            </button>
          }
        </div>

        @if (cargando) {
          <p class="muted">Cargando...</p>
        } @else {
          <div class="timeline-wrap">
            <div class="timeline-ruler" [style.height.px]="alturaTimeline()">
              @for (tick of ticks; track tick) {
                <div class="tick" [style.top.px]="minutosAPx(tick - minutosInicio())">
                  {{ formatMinutos(tick) }}
                </div>
              }
            </div>
            <div
              #track
              class="timeline-track"
              [style.height.px]="alturaTimeline()"
              (mousedown)="onTrackDown($event)"
              (mousemove)="onTrackMove($event)"
              (mouseup)="onTrackUp()"
            >
              @for (h of huecosLibres(); track h.inicio + h.fin) {
                <button
                  type="button"
                  class="bloque bloque--libre"
                  [style.top.px]="topDe(h.inicio)"
                  [style.height.px]="altoDe(h.inicio, h.fin)"
                  (mousedown)="onHuecoDown($event, h)"
                  title="Arrastrá o clic para usar este hueco"
                >
                  Libre · {{ h.inicio }}–{{ h.fin }}
                </button>
              }
              @for (f of franjasDelDia(); track f.id) {
                <div
                  class="bloque bloque--ocupado"
                  [class.bloque--edit]="editId === f.id"
                  [style.top.px]="topDe(f.horaInicio)"
                  [style.height.px]="altoDe(f.horaInicio, f.horaFin)"
                  (mousedown)="$event.stopPropagation()"
                  (click)="editar(f)"
                >
                  <strong>{{ f.etiqueta?.trim() || 'Franja' }}</strong>
                  <span>{{ f.horaInicio }}–{{ f.horaFin }}</span>
                </div>
              }
              @if (seleccion) {
                <div
                  class="bloque bloque--sel"
                  [style.top.px]="topDe(seleccion.inicio)"
                  [style.height.px]="altoDe(seleccion.inicio, seleccion.fin)"
                >
                  {{ seleccion.inicio }}–{{ seleccion.fin }}
                </div>
              }
            </div>
          </div>
        }

        <div class="form-franja">
          <h3>{{ editId ? 'Editar franja' : 'Nueva franja' }}</h3>
          <div class="form-grid form-grid-wide">
            <label>
              Etiqueta (opcional)
              <input
                type="text"
                [(ngModel)]="form.etiqueta"
                [ngModelOptions]="{ standalone: true }"
                placeholder="Mañana / Plenaria / ..."
              />
            </label>
            <label>
              Inicio
              <input
                type="time"
                [(ngModel)]="form.horaInicio"
                [ngModelOptions]="{ standalone: true }"
              />
            </label>
            <label>
              Fin
              <input type="time" [(ngModel)]="form.horaFin" [ngModelOptions]="{ standalone: true }" />
            </label>
          </div>
          <div class="inline-form-row" style="margin-top: 0.75rem">
            <button type="button" class="btn-primary" [disabled]="guardando" (click)="guardarFranja()">
              {{ guardando ? 'Guardando...' : editId ? 'Actualizar' : 'Crear franja' }}
            </button>
            @if (editId) {
              <button type="button" class="btn-link" [disabled]="guardando" (click)="cancelar()">
                Cancelar
              </button>
              <button type="button" class="btn-link" [disabled]="guardando" (click)="desactivarActual()">
                Desactivar
              </button>
            }
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .check-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.85rem;
        font-weight: 500;
      }
      .override-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.75rem;
        margin-top: 0.85rem;
      }
      .override-dia {
        border: 1px solid rgba(15, 23, 42, 0.1);
        border-radius: 10px;
        padding: 0.65rem 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }
      .override-dia legend {
        padding: 0 0.25rem;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .dia-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 1rem 0;
      }
      .dia-tab {
        border: 1px solid rgba(15, 23, 42, 0.12);
        background: #fff;
        border-radius: 10px;
        padding: 0.55rem 0.9rem;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.15rem;
      }
      .dia-tab--activo {
        border-color: #4f46e5;
        background: #eef2ff;
        box-shadow: 0 0 0 1px #4f46e5 inset;
      }
      .dia-tab-meta {
        font-size: 0.75rem;
        color: #64748b;
      }
      .timeline-wrap {
        display: grid;
        grid-template-columns: 56px 1fr;
        gap: 0.35rem;
        margin-top: 0.5rem;
        user-select: none;
      }
      .timeline-ruler {
        position: relative;
      }
      .tick {
        position: absolute;
        left: 0;
        transform: translateY(-50%);
        font-size: 0.7rem;
        color: #64748b;
      }
      .timeline-track {
        position: relative;
        background: linear-gradient(180deg, #f8fafc, #f1f5f9);
        border: 1px solid rgba(15, 23, 42, 0.1);
        border-radius: 12px;
        overflow: hidden;
        cursor: crosshair;
      }
      .bloque {
        position: absolute;
        left: 0.4rem;
        right: 0.4rem;
        border-radius: 8px;
        padding: 0.35rem 0.55rem;
        font-size: 0.8rem;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.1rem;
        overflow: hidden;
      }
      .bloque--libre {
        border: 1px dashed rgba(16, 185, 129, 0.55);
        background: rgba(16, 185, 129, 0.12);
        color: #047857;
        cursor: crosshair;
        text-align: left;
      }
      .bloque--libre:hover {
        background: rgba(16, 185, 129, 0.22);
      }
      .bloque--ocupado {
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        color: #fff;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
      }
      .bloque--edit {
        outline: 2px solid #f59e0b;
        outline-offset: 1px;
      }
      .bloque--sel {
        background: rgba(245, 158, 11, 0.35);
        border: 2px solid #d97706;
        color: #92400e;
        pointer-events: none;
        font-weight: 600;
      }
      .form-franja {
        margin-top: 1.25rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(15, 23, 42, 0.08);
      }
      .form-franja h3 {
        margin: 0 0 0.65rem;
        font-size: 1.05rem;
      }
    `,
  ],
})
export class CongresoFranjasAdminComponent implements OnInit {
  private franjaService = inject(FranjaHorariaService);
  private congService = inject(CongresoConfigService);

  readonly dias: DiaCongreso[] = [1, 2, 3];

  config: CongresoConfig | null = null;
  franjas: FranjaHoraria[] = [];
  cargando = true;
  guardando = false;
  guardandoJornada = false;
  editId: number | null = null;
  feedback = '';
  feedbackOk = false;
  diaActivo: DiaCongreso = 1;

  jornada = { inicio: '09:00', fin: '20:00' };
  usarOverride = false;
  overrideIni: Record<DiaCongreso, string> = { 1: '', 2: '', 3: '' };
  overrideFin: Record<DiaCongreso, string> = { 1: '', 2: '', 3: '' };

  form = { etiqueta: '', horaInicio: '09:00', horaFin: '10:00' };

  seleccion: { inicio: string; fin: string } | null = null;
  private dragActivo = false;
  private dragAnclaMin: number | null = null;
  private dragLimiteIni: number | null = null;
  private dragLimiteFin: number | null = null;

  ticks: number[] = [];

  ngOnInit(): void {
    this.cargarTodo();
  }

  @HostListener('window:mouseup')
  onWindowUp(): void {
    this.onTrackUp();
  }

  @HostListener('window:mousemove', ['$event'])
  onWindowMove(ev: MouseEvent): void {
    if (this.dragActivo) {
      this.onTrackMove(ev);
    }
  }

  jornadaDelDia(d: DiaCongreso): { inicio: string; fin: string } {
    if (!this.config) {
      return { inicio: this.jornada.inicio, fin: this.jornada.fin };
    }
    return jornadaEfectiva(this.config, d);
  }

  franjasDelDia(): FranjaHoraria[] {
    return this.franjas
      .filter((f) => f.activa && f.diaCongreso === this.diaActivo)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  huecosLibres(): HuecoLibre[] {
    const j = this.jornadaDelDia(this.diaActivo);
    const ocupadas = this.franjasDelDia();
    const huecos: HuecoLibre[] = [];
    let cursor = j.inicio;
    for (const f of ocupadas) {
      if (f.horaInicio > cursor) {
        huecos.push({ inicio: cursor, fin: f.horaInicio });
      }
      if (f.horaFin > cursor) {
        cursor = f.horaFin;
      }
    }
    if (cursor < j.fin) {
      huecos.push({ inicio: cursor, fin: j.fin });
    }
    return huecos.filter((h) => this.aMinutos(h.fin) - this.aMinutos(h.inicio) >= SNAP_MIN);
  }

  minutosInicio(): number {
    return this.aMinutos(this.jornadaDelDia(this.diaActivo).inicio);
  }

  minutosFin(): number {
    return this.aMinutos(this.jornadaDelDia(this.diaActivo).fin);
  }

  alturaTimeline(): number {
    return Math.max(220, (this.minutosFin() - this.minutosInicio()) * PX_POR_MIN);
  }

  minutosAPx(minDesdeInicio: number): number {
    return minDesdeInicio * PX_POR_MIN;
  }

  topDe(hora: string): number {
    return (this.aMinutos(hora) - this.minutosInicio()) * PX_POR_MIN;
  }

  altoDe(inicio: string, fin: string): number {
    return Math.max(22, (this.aMinutos(fin) - this.aMinutos(inicio)) * PX_POR_MIN);
  }

  formatMinutos(total: number): string {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  seleccionarDia(d: DiaCongreso): void {
    this.diaActivo = d;
    this.cancelar();
    this.rebuildTicks();
  }

  limpiarOverride(d: DiaCongreso): void {
    this.overrideIni[d] = '';
    this.overrideFin[d] = '';
  }

  cargarTodo(): void {
    this.cargando = true;
    this.congService.obtener().subscribe({
      next: (cfg) => {
        this.config = cfg;
        this.aplicarConfigAFormulario(cfg);
        this.franjaService.listarAdmin().subscribe({
          next: (items) => {
            this.franjas = items;
            this.cargando = false;
            this.rebuildTicks();
          },
          error: () => {
            this.franjas = [];
            this.cargando = false;
            this.rebuildTicks();
          },
        });
      },
      error: () => {
        this.cargando = false;
        this.feedbackOk = false;
        this.feedback = 'No se pudo cargar la configuración del congreso.';
      },
    });
  }

  private aplicarConfigAFormulario(cfg: CongresoConfig): void {
    this.jornada = {
      inicio: cfg.jornadaInicio || '09:00',
      fin: cfg.jornadaFin || '20:00',
    };
    this.overrideIni = {
      1: cfg.jornadaInicioDia1 || '',
      2: cfg.jornadaInicioDia2 || '',
      3: cfg.jornadaInicioDia3 || '',
    };
    this.overrideFin = {
      1: cfg.jornadaFinDia1 || '',
      2: cfg.jornadaFinDia2 || '',
      3: cfg.jornadaFinDia3 || '',
    };
    this.usarOverride = !!(
      cfg.jornadaInicioDia1 ||
      cfg.jornadaFinDia1 ||
      cfg.jornadaInicioDia2 ||
      cfg.jornadaFinDia2 ||
      cfg.jornadaInicioDia3 ||
      cfg.jornadaFinDia3
    );
  }

  guardarJornada(): void {
    if (this.guardandoJornada) return;
    this.feedback = '';
    this.guardandoJornada = true;
    const body = {
      grupo: 'JORNADA' as const,
      jornadaInicio: this.jornada.inicio,
      jornadaFin: this.jornada.fin,
      jornadaInicioDia1: this.usarOverride ? this.overrideIni[1] || '' : '',
      jornadaFinDia1: this.usarOverride ? this.overrideFin[1] || '' : '',
      jornadaInicioDia2: this.usarOverride ? this.overrideIni[2] || '' : '',
      jornadaFinDia2: this.usarOverride ? this.overrideFin[2] || '' : '',
      jornadaInicioDia3: this.usarOverride ? this.overrideIni[3] || '' : '',
      jornadaFinDia3: this.usarOverride ? this.overrideFin[3] || '' : '',
    };
    this.congService.actualizar(body).subscribe({
      next: (cfg) => {
        this.config = cfg;
        this.aplicarConfigAFormulario(cfg);
        this.guardandoJornada = false;
        this.feedbackOk = true;
        this.feedback = 'Jornada guardada.';
        this.rebuildTicks();
      },
      error: (err) => {
        this.guardandoJornada = false;
        this.feedbackOk = false;
        this.feedback = mensajeErrorApi(err, 'No se pudo guardar la jornada.');
      },
    });
  }

  editar(f: FranjaHoraria): void {
    this.editId = f.id ?? null;
    this.diaActivo = f.diaCongreso as DiaCongreso;
    this.form = {
      etiqueta: f.etiqueta ?? '',
      horaInicio: f.horaInicio,
      horaFin: f.horaFin,
    };
    this.seleccion = null;
    this.feedback = '';
  }

  cancelar(): void {
    this.editId = null;
    this.seleccion = null;
    const j = this.jornadaDelDia(this.diaActivo);
    this.form = { etiqueta: '', horaInicio: j.inicio, horaFin: this.sumarMinutos(j.inicio, 60) };
  }

  guardarFranja(): void {
    if (this.guardando) return;
    this.feedback = '';
    if (!this.form.horaInicio || !this.form.horaFin) {
      this.feedbackOk = false;
      this.feedback = 'Indicá hora de inicio y fin.';
      return;
    }
    this.guardando = true;
    const body = {
      diaCongreso: this.diaActivo,
      etiqueta: this.form.etiqueta.trim() || null,
      horaInicio: this.form.horaInicio,
      horaFin: this.form.horaFin,
      activa: true,
    };
    const req =
      this.editId != null
        ? this.franjaService.modificar(this.editId, body)
        : this.franjaService.crear(body);
    req.subscribe({
      next: () => {
        this.guardando = false;
        this.feedbackOk = true;
        this.feedback = this.editId ? 'Franja actualizada.' : 'Franja creada.';
        this.cancelar();
        this.recargarFranjas();
      },
      error: (err) => {
        this.guardando = false;
        this.feedbackOk = false;
        this.feedback = mensajeErrorApi(err, 'No se pudo guardar la franja.');
      },
    });
  }

  desactivarActual(): void {
    if (!this.editId || this.guardando) return;
    this.guardando = true;
    this.franjaService.desactivar(this.editId).subscribe({
      next: () => {
        this.guardando = false;
        this.feedbackOk = true;
        this.feedback = 'Franja desactivada.';
        this.cancelar();
        this.recargarFranjas();
      },
      error: (err) => {
        this.guardando = false;
        this.feedbackOk = false;
        this.feedback = mensajeErrorApi(err, 'No se pudo desactivar la franja.');
      },
    });
  }

  private recargarFranjas(): void {
    this.franjaService.listarAdmin().subscribe({
      next: (items) => (this.franjas = items),
    });
  }

  onHuecoDown(ev: MouseEvent, h: HuecoLibre): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.iniciarDrag(ev, h);
  }

  onTrackDown(ev: MouseEvent): void {
    if ((ev.target as HTMLElement).closest('.bloque--ocupado')) {
      return;
    }
    this.iniciarDrag(ev);
  }

  onTrackMove(ev: MouseEvent): void {
    if (!this.dragActivo || this.dragAnclaMin == null) return;
    const min = this.minutosDesdeEvento(ev);
    if (min == null) return;
    const limIni = this.dragLimiteIni ?? this.minutosInicio();
    const limFin = this.dragLimiteFin ?? this.minutosFin();
    const clamped = Math.min(limFin, Math.max(limIni, min));
    const a = Math.min(this.dragAnclaMin, clamped);
    const b = Math.max(this.dragAnclaMin, clamped);
    let inicio = this.snapFloor(a);
    let fin = this.snapCeil(b);
    inicio = Math.max(limIni, inicio);
    fin = Math.min(limFin, fin);
    if (fin <= inicio) {
      fin = Math.min(limFin, inicio + SNAP_MIN);
    }
    this.seleccion = {
      inicio: this.formatMinutos(inicio),
      fin: this.formatMinutos(fin),
    };
  }

  onTrackUp(): void {
    if (!this.dragActivo) return;
    this.dragActivo = false;
    this.dragAnclaMin = null;
    this.dragLimiteIni = null;
    this.dragLimiteFin = null;
    if (this.seleccion) {
      const dur = this.aMinutos(this.seleccion.fin) - this.aMinutos(this.seleccion.inicio);
      if (dur >= SNAP_MIN) {
        this.editId = null;
        this.form = {
          etiqueta: this.form.etiqueta,
          horaInicio: this.seleccion.inicio,
          horaFin: this.seleccion.fin,
        };
      }
    }
  }

  private iniciarDrag(ev: MouseEvent, hueco?: HuecoLibre): void {
    const min = this.minutosDesdeEvento(ev);
    if (min == null) return;
    const limIni = hueco ? this.aMinutos(hueco.inicio) : this.minutosInicio();
    const limFin = hueco ? this.aMinutos(hueco.fin) : this.minutosFin();
    this.dragLimiteIni = limIni;
    this.dragLimiteFin = limFin;
    let ancla = this.snapFloor(min);
    ancla = Math.min(Math.max(ancla, limIni), limFin - SNAP_MIN);
    this.dragActivo = true;
    this.dragAnclaMin = ancla;
    this.editId = null;
    this.seleccion = {
      inicio: this.formatMinutos(ancla),
      fin: this.formatMinutos(Math.min(limFin, ancla + SNAP_MIN)),
    };
  }

  private minutosDesdeEvento(ev: MouseEvent): number | null {
    const el =
      document.querySelector('.timeline-track') ||
      (ev.target as HTMLElement | null)?.closest?.('.timeline-track');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const y = ev.clientY - rect.top;
    const min = this.minutosInicio() + y / PX_POR_MIN;
    return Math.min(this.minutosFin(), Math.max(this.minutosInicio(), min));
  }

  private snapFloor(min: number): number {
    const base = this.minutosInicio();
    const rel = min - base;
    return base + Math.floor(rel / SNAP_MIN) * SNAP_MIN;
  }

  private snapCeil(min: number): number {
    const base = this.minutosInicio();
    const rel = min - base;
    return Math.min(this.minutosFin(), base + Math.ceil(rel / SNAP_MIN) * SNAP_MIN);
  }

  private rebuildTicks(): void {
    const ini = this.minutosInicio();
    const fin = this.minutosFin();
    const ticks: number[] = [];
    // marcas cada hora
    let t = Math.ceil(ini / 60) * 60;
    if (t === ini) {
      ticks.push(ini);
      t += 60;
    } else {
      ticks.push(ini);
    }
    for (; t < fin; t += 60) {
      ticks.push(t);
    }
    ticks.push(fin);
    this.ticks = ticks;
  }

  private aMinutos(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  private sumarMinutos(hhmm: string, add: number): string {
    return this.formatMinutos(Math.min(this.minutosFin(), this.aMinutos(hhmm) + add));
  }
}
