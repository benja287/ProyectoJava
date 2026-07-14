import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Actividad } from '../../models/actividad.model';
import { Aula } from '../../models/aula.model';
import { LoginService } from '../../auth/login.service';
import { ActividadService } from '../../servicios/actividad.service';
import { AulaService } from '../../servicios/aula.service';
import { CongresoConfigService } from '../../servicios/congreso-config.service';
import { CongresoConfig } from '../../models/congreso-config.model';
import {
  etiquetaFechaCongreso,
  fechaClaveActividad,
  horaActividad,
} from '../../utils/fecha.util';
import { urlMapaAula } from '../../utils/aula-mapa.util';
import { mensajeErrorApi } from '../../utils/api-error.util';
import { filter, Subscription } from 'rxjs';

const ETIQUETAS_TIPO: Record<string, string> = {
  MESA_TEMATICA: 'Mesa temática',
  MESA_REDONDA: 'Mesa redonda',
  POSTER: 'Sesión de pósters',
  TALLER: 'Taller',
  CONFERENCIA: 'Conferencia',
};

const ORDEN_TIPO: Record<string, number> = {
  MESA_TEMATICA: 1,
  MESA_REDONDA: 2,
  POSTER: 3,
  TALLER: 4,
  CONFERENCIA: 5,
};

@Component({
  selector: 'app-programa-congreso',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="programa-page">
      <header class="programa-hero">
        <h1>Programa del congreso</h1>
        <p class="muted">{{ subtituloPrograma }}</p>
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
        @for (fecha of fechasOrdenadas; track fecha) {
          <section class="programa-dia-grupo">
            <h2 class="programa-dia-titulo">📅 {{ etiquetaFecha(fecha) }}</h2>
            <div class="programa-lista">
              @for (a of actividadesPorFecha(fecha); track a.id) {
                <article class="programa-item" [class]="claseTipo(a.tipoActividad)">
                  <div class="programa-item-header">
                    <span class="programa-tipo-badge">{{ etiquetaTipo(a.tipoActividad) }}</span>
                    @if (a.codigo) {
                      <span class="muted small">{{ a.codigo }}</span>
                    }
                  </div>
                  <h3>{{ a.titulo }}</h3>
                  <div class="programa-meta">
                    <span>🕐 {{ horario(a) }}</span>
                    @if (a.sala) {
                      <span>
                        📍 {{ a.sala }}
                        @if (linkMapaActividad(a); as url) {
                          ·
                          <a [href]="url" target="_blank" rel="noopener noreferrer">Ver mapa</a>
                        }
                      </span>
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
          </section>
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
  aulasPorId = new Map<number, Aula>();
  cargando = true;
  error = '';
  private navSub?: Subscription;

  constructor(
    public loginService: LoginService,
    private congresoConfigService: CongresoConfigService,
    private actividadService: ActividadService,
    private aulaService: AulaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.aulaService.listarActivas().subscribe({
      next: (items) => {
        this.aulasPorId = new Map(
          items.filter((a) => a.id != null).map((a) => [a.id!, a])
        );
      },
      error: () => (this.aulasPorId = new Map()),
    });
    this.cargarPrograma();
    this.navSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.cargarPrograma());
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  linkMapaActividad(a: Actividad): string | null {
    const aula = a.aulaId != null ? this.aulasPorId.get(a.aulaId) : undefined;
    if (aula) {
      return urlMapaAula(aula);
    }
    if (a.sala) {
      return urlMapaAula({ nombre: a.sala, ubicacion: a.sala });
    }
    return null;
  }

  get subtituloPrograma(): string {
    const ed = this.config?.edicion?.trim() || 'V';
    const nom = this.config?.nombre?.trim() || 'Congreso Argentino de Agroecología';
    const sede = this.config?.sede?.trim() || 'La Plata';
    const anio = this.config?.congresoDesde?.slice(0, 4) || '2027';
    return `${ed} ${nom} · ${sede} ${anio}`;
  }

  get fechasOrdenadas(): string[] {
    const fechas = new Set(this.actividades.map((a) => fechaClaveActividad(a.inicio)).filter(Boolean));
    return [...fechas].sort();
  }

  actividadesPorFecha(fecha: string): Actividad[] {
    return this.actividades
      .filter((a) => fechaClaveActividad(a.inicio) === fecha)
      .sort((x, y) => this.compararActividades(x, y));
  }

  etiquetaFecha(fechaIso: string): string {
    return etiquetaFechaCongreso(fechaIso);
  }

  etiquetaTipo(tipo: string): string {
    return ETIQUETAS_TIPO[tipo] ?? tipo;
  }

  claseTipo(tipo: string): string {
    return `programa-item--${tipo.toLowerCase().replace('_', '-')}`;
  }

  horario(a: Actividad): string {
    const hi = horaActividad(a.inicio);
    const hf = horaActividad(a.fin);
    return hf && hf !== '—' && hf !== hi ? `${hi} – ${hf}` : hi;
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

  private cargarActividades(): void {
    this.actividadService.listar(1, 100).subscribe({
      next: (items) => {
        this.actividades = [...items].sort((a, b) => this.compararActividades(a, b));
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar el programa.');
        this.cargando = false;
      },
    });
  }

  private compararActividades(a: Actividad, b: Actividad): number {
    const ta = this.timestampDe(a.inicio);
    const tb = this.timestampDe(b.inicio);
    if (ta !== tb) return ta - tb;
    const oa = ORDEN_TIPO[a.tipoActividad] ?? 99;
    const ob = ORDEN_TIPO[b.tipoActividad] ?? 99;
    return oa - ob;
  }

  private timestampDe(inicio: unknown): number {
    const clave = fechaClaveActividad(inicio);
    const hora = horaActividad(inicio);
    if (!clave) return 0;
    const t = Date.parse(`${clave}T${hora === '—' ? '00:00' : hora}:00`);
    return Number.isNaN(t) ? 0 : t;
  }
}
