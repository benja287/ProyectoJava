import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Actividad } from '../../models/actividad.model';
import { LoginService } from '../../auth/login.service';
import { ActividadService } from '../../servicios/actividad.service';
import { CongresoConfigService } from '../../servicios/congreso-config.service';
import { CongresoConfig } from '../../models/congreso-config.model';
import { formatFechaActividad } from '../../utils/fecha.util';
import { mensajeErrorApi } from '../../utils/api-error.util';
import { filter, Subscription } from 'rxjs';

const ETIQUETAS_TIPO: Record<string, string> = {
  MESA_TEMATICA: 'Mesa temática',
  MESA_REDONDA: 'Mesa redonda',
  POSTER: 'Sesión de pósters',
  TALLER: 'Taller',
  CONFERENCIA: 'Conferencia',
};

@Component({
  selector: 'app-programa-congreso',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="programa-page">
      <header class="programa-hero">
        <h1>Programa del congreso</h1>
        <p class="muted">V Congreso Argentino de Agroecología · La Plata 2027</p>
        @if (loginService.esAsistenteCongreso() || loginService.hasRole('AUTOR')) {
          <a
            [routerLink]="loginService.hasRole('AUTOR') ? '/autor/cronograma' : '/asistente/cronograma'"
            class="btn-primary programa-agenda-link"
          >
            Ver mi agenda personal
          </a>
        }
      </header>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (cargando) {
        <p>Cargando programa...</p>
      } @else if (!config) {
        <div class="panel-card programa-empty">
          <p>No se pudo cargar el estado de publicación del programa.</p>
        </div>
      } @else if (!config.programaPublicado) {
        <div class="panel-card programa-empty">
          <p>El programa aún no fue publicado por el organizador.</p>
        </div>
      } @else if (!actividades.length) {
        <div class="panel-card programa-empty">
          <p>No hay actividades cargadas todavía.</p>
        </div>
      } @else {
        @if (dias.length > 1) {
          <div class="programa-dias">
            @for (dia of dias; track dia; let i = $index) {
              <button
                type="button"
                class="programa-dia-btn"
                [class.activo]="diaSeleccionado === dia"
                (click)="diaSeleccionado = dia"
              >
                Día {{ i + 1 }}
                <span class="small">{{ dia }}</span>
              </button>
            }
          </div>
        }

        @if (!actividadesDelDia.length) {
          <div class="panel-card programa-empty">
            <p>No hay actividades cargadas para este día.</p>
          </div>
        } @else {
          <div class="programa-lista">
            @for (a of actividadesDelDia; track a.id) {
              <article class="programa-item" [class]="claseTipo(a.tipoActividad)">
                <div class="programa-item-header">
                  <span class="programa-tipo-badge">{{ etiquetaTipo(a.tipoActividad) }}</span>
                  @if (a.codigo) {
                    <span class="muted small">{{ a.codigo }}</span>
                  }
                </div>
                <h2>{{ a.titulo }}</h2>
                <div class="programa-meta">
                  <span>🕐 {{ horario(a) }}</span>
                  @if (a.sala) {
                    <span>📍 {{ a.sala }}</span>
                  }
                </div>
                @if (a.moderador) {
                  <p class="programa-detalle"><strong>Moderador/a:</strong> {{ a.moderador }}</p>
                }
                @if (a.panelistas) {
                  <p class="programa-detalle"><strong>Panelistas:</strong> {{ a.panelistas }}</p>
                }
                @if (a.responsables) {
                  <p class="programa-detalle"><strong>Responsable(s):</strong> {{ a.responsables }}</p>
                }
                @if (a.conferencistas) {
                  <p class="programa-detalle"><strong>Conferencista(s):</strong> {{ a.conferencistas }}</p>
                }
                @if (a.institucion) {
                  <p class="programa-detalle"><strong>Institución:</strong> {{ a.institucion }}</p>
                }
                @if (a.ejeTematico) {
                  <p class="programa-detalle"><strong>Eje temático:</strong> {{ a.ejeTematico }}</p>
                }
                @if (a.descripcion) {
                  <p class="programa-detalle programa-descripcion">{{ a.descripcion }}</p>
                }
              </article>
            }
          </div>
        }
      }

      @if (!loginService.isLogged()) {
        <p class="programa-login-hint muted">
          <a routerLink="/login">Iniciá sesión</a> como asistente para armar tu agenda personal.
        </p>
      }

      <p><a routerLink="/">← Volver al inicio</a></p>
    </section>
  `,
})
export class ProgramaCongresoComponent implements OnInit, OnDestroy {
  config?: CongresoConfig;
  actividades: Actividad[] = [];
  dias: string[] = [];
  diaSeleccionado = '';
  cargando = true;
  error = '';
  private navSub?: Subscription;

  constructor(
    public loginService: LoginService,
    private congresoConfigService: CongresoConfigService,
    private actividadService: ActividadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPrograma();
    this.navSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.cargarPrograma());
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  private cargarPrograma(): void {
    this.cargando = true;
    this.error = '';
    this.actividades = [];
    this.congresoConfigService.obtener().subscribe({
      next: (c) => {
        this.config = c;
        if (!c.programaPublicado) {
          this.cargando = false;
          return;
        }
        this.cargarActividades();
      },
      error: (err) => {
        this.config = undefined;
        this.error = mensajeErrorApi(err, 'No se pudo cargar la configuración del congreso.');
        this.cargando = false;
      },
    });
  }

  get actividadesDelDia(): Actividad[] {
    if (!this.diaSeleccionado) {
      return this.actividades;
    }
    return this.actividades.filter((a) => this.fechaDe(a) === this.diaSeleccionado);
  }

  etiquetaTipo(tipo: string): string {
    return ETIQUETAS_TIPO[tipo] ?? tipo;
  }

  claseTipo(tipo: string): string {
    return `programa-item--${tipo.toLowerCase().replace('_', '-')}`;
  }

  horario(a: Actividad): string {
    const ini = formatFechaActividad(a.inicio);
    const fin = formatFechaActividad(a.fin);
    if (ini === '—') return '—';
    const horaIni = ini.includes(' ') ? ini.split(' ')[1] : ini;
    const horaFin = fin.includes(' ') ? fin.split(' ')[1] : fin;
    return horaFin && horaFin !== '—' ? `${horaIni} – ${horaFin}` : horaIni;
  }

  private cargarActividades(): void {
    this.actividadService.listar(1, 100).subscribe({
      next: (items) => {
        this.actividades = [...items].sort((a, b) =>
          this.fechaDe(a).localeCompare(this.fechaDe(b)) ||
          this.horario(a).localeCompare(this.horario(b))
        );
        this.dias = [...new Set(this.actividades.map((a) => this.fechaDe(a)).filter(Boolean))].sort();
        this.diaSeleccionado = this.dias[0] ?? '';
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar el programa.');
        this.cargando = false;
      },
    });
  }

  private fechaDe(a: Actividad): string {
    const raw = formatFechaActividad(a.inicio);
    if (raw === '—') return '';
    return raw.includes(' ') ? raw.split(' ')[0] : raw.slice(0, 10);
  }
}
