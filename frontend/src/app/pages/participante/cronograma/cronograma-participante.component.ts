import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoginService } from '../../../auth/login.service';
import { Actividad } from '../../../models/actividad.model';
import { Cronograma } from '../../../models/cronograma.model';
import { ActividadService } from '../../../servicios/actividad.service';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { CronogramaService } from '../../../servicios/cronograma.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import {
  etiquetaFechaCongreso,
  fechaClaveActividad,
  horaActividad,
} from '../../../utils/fecha.util';
import { Aula } from '../../../models/aula.model';
import { AulaService } from '../../../servicios/aula.service';
import { AulaUbicacionLinkComponent } from '../../../components/aula-mapa/aula-ubicacion-link.component';
import { cupoAgendaCompleto, etiquetaCupoAgenda } from '../../../utils/cupo-agenda.util';

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
  selector: 'app-cronograma-participante',
  standalone: true,
  imports: [CommonModule, RouterLink, AulaUbicacionLinkComponent],
  template: `
    <div class="agenda-page asistente-subvista">
      <header class="agenda-hero panel-hero panel-hero--admin asistente-sub-hero">
        <span class="agenda-hero-icon panel-hero-icon" aria-hidden="true">📅</span>
        <div>
          <h1>Mi agenda</h1>
          <p>Tus actividades seleccionadas del congreso (rol {{ etiquetaPerfil }})</p>
        </div>
      </header>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok agenda-feedback">{{ mensaje }}</p>
      }

      <div class="agenda-toolbar">
        <a routerLink="/programa" class="agenda-btn-programa">Ver programa completo</a>
        <a [routerLink]="panelRoute" class="agenda-btn-volver">← {{ etiquetaVolver }}</a>
      </div>

      @if (cargando) {
        <p class="muted">Cargando agenda...</p>
      } @else if (!programaPublicado) {
        <div class="panel-card programa-empty">
          <p>El programa aún no fue publicado por el organizador.</p>
          <p class="muted small">
            Cuando el administrador publique el cronograma, vas a poder armar tu agenda personal.
          </p>
        </div>
      } @else {
        <section class="agenda-seccion">
          <h2 class="agenda-seccion-titulo">Actividades en mi agenda</h2>

          @if (!cronograma?.actividades?.length) {
            <div class="agenda-empty">
              <p>Todavía no agregaste actividades a tu agenda.</p>
              <p class="muted small">Elegí actividades del listado de abajo o desde el programa del congreso.</p>
            </div>
          } @else {
            @for (fecha of fechasAgenda; track fecha) {
              <div class="agenda-dia-grupo">
                <h3 class="agenda-dia-titulo">📅 {{ etiquetaFecha(fecha) }}</h3>
                <div class="agenda-dia-items">
                  @for (a of actividadesAgendaPorFecha(fecha); track a.id) {
                    <article class="agenda-card" [ngClass]="claseTipo(a.tipoActividad)">
                      <div class="agenda-card-body">
                        <div class="agenda-card-info">
                          <span class="agenda-tipo-badge">{{ etiquetaTipo(a.tipoActividad) }}</span>
                          <h4>{{ tituloActividad(a) }}</h4>
                          <div class="agenda-card-meta">
                            <span>🕐 {{ horario(a) }}</span>
                            @if (a.sala || a.aulaId) {
                              <app-aula-ubicacion-link
                                [aula]="aulaDe(a)"
                                [aulaId]="a.aulaId ?? null"
                                [sala]="a.sala || ''"
                              />
                            }
                            @if (etiquetaCupo(a); as cupo) {
                              <span
                                class="cupo-aula"
                                [class.cupo-aula--lleno]="cupoLleno(a)"
                                [attr.title]="'Agendados / capacidad del aula'"
                              >
                                Cupo {{ cupo }}
                              </span>
                            }
                          </div>
                        </div>
                        <button
                          type="button"
                          class="agenda-btn-quitar"
                          [disabled]="procesandoQuitarId === a.id"
                          (click)="quitar(a)"
                        >
                          {{ procesandoQuitarId === a.id ? 'Quitando...' : 'Quitar de mi agenda' }}
                        </button>
                      </div>
                    </article>
                  }
                </div>
              </div>
            }
          }
        </section>

        <section class="agenda-seccion agenda-seccion--agregar">
          <h2 class="agenda-seccion-titulo">Agregar actividad del congreso</h2>

          @if (actividadesDisponibles.length === 0) {
            <p class="muted">No hay más actividades para agregar. Ya sumaste todo el programa a tu agenda.</p>
          } @else {
            @for (fecha of fechasDisponibles; track fecha) {
              <div class="agenda-dia-grupo">
                <h3 class="agenda-dia-titulo">📅 {{ etiquetaFecha(fecha) }}</h3>
                <div class="agenda-dia-items">
                  @for (a of actividadesDisponiblesPorFecha(fecha); track a.id) {
                    <article class="agenda-card agenda-card--disponible" [ngClass]="claseTipo(a.tipoActividad)">
                      <div class="agenda-card-body">
                        <div class="agenda-card-info">
                          <span class="agenda-tipo-badge">{{ etiquetaTipo(a.tipoActividad) }}</span>
                          <h4>{{ tituloActividad(a) }}</h4>
                          <div class="agenda-card-meta">
                            <span>🕐 {{ horario(a) }}</span>
                            @if (a.sala || a.aulaId) {
                              <app-aula-ubicacion-link
                                [aula]="aulaDe(a)"
                                [aulaId]="a.aulaId ?? null"
                                [sala]="a.sala || ''"
                              />
                            }
                            @if (etiquetaCupo(a); as cupo) {
                              <span
                                class="cupo-aula"
                                [class.cupo-aula--lleno]="cupoLleno(a)"
                                [attr.title]="'Agendados / capacidad del aula'"
                              >
                                Cupo {{ cupo }}
                              </span>
                            }
                          </div>
                        </div>
                        <button
                          type="button"
                          class="agenda-btn-agregar"
                          [disabled]="procesandoAgregarId === a.id || cupoLleno(a)"
                          (click)="agregar(a)"
                        >
                          @if (cupoLleno(a)) {
                            Cupo completo
                          } @else if (procesandoAgregarId === a.id) {
                            Agregando...
                          } @else {
                            Agregar a mi agenda
                          }
                        </button>
                      </div>
                    </article>
                  }
                </div>
              </div>
            }
          }
        </section>
      }
    </div>
  `,
})
export class CronogramaParticipanteComponent implements OnInit {
  cronograma?: Cronograma;
  todasActividades: Actividad[] = [];
  aulasPorId = new Map<number, Aula>();
  programaPublicado = false;
  cargando = true;
  error = '';
  mensaje = '';
  usuarioId?: number;
  procesandoAgregarId?: number;
  procesandoQuitarId?: number;
  perfilParticipante: 'asistente' | 'autor' = 'asistente';
  panelRoute = '/asistente';
  etiquetaVolver = 'Panel asistente';

  get etiquetaPerfil(): string {
    return this.perfilParticipante;
  }

  get actividadesDisponibles(): Actividad[] {
    const enCronograma = new Set(this.cronograma?.actividades?.map((a) => a.id));
    return this.todasActividades
      .filter((a) => a.id && !enCronograma.has(a.id))
      .sort((a, b) => this.compararActividades(a, b));
  }

  get fechasAgenda(): string[] {
    const fechas = new Set(
      (this.cronograma?.actividades ?? []).map((a) => fechaClaveActividad(a.inicio)).filter(Boolean)
    );
    return [...fechas].sort();
  }

  get fechasDisponibles(): string[] {
    const fechas = new Set(this.actividadesDisponibles.map((a) => fechaClaveActividad(a.inicio)).filter(Boolean));
    return [...fechas].sort();
  }

  constructor(
    private loginService: LoginService,
    private cronogramaService: CronogramaService,
    private actividadService: ActividadService,
    private aulaService: AulaService,
    private congresoConfigService: CongresoConfigService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const perfil = this.route.snapshot.data['perfilParticipante'];
    if (perfil === 'autor') {
      this.perfilParticipante = 'autor';
      this.panelRoute = '/autor';
      this.etiquetaVolver = 'Panel autor';
    }

    this.usuarioId = this.loginService.getUser()?.id;
    if (!this.usuarioId) {
      this.error = 'Sesión inválida.';
      this.cargando = false;
      return;
    }

    this.aulaService.listarActivas().subscribe({
      next: (items) => {
        this.aulasPorId = new Map(items.filter((a) => a.id != null).map((a) => [a.id!, a]));
      },
      error: () => (this.aulasPorId = new Map()),
    });

    this.congresoConfigService.obtener().subscribe({
      next: (config) => {
        this.programaPublicado = config.programaPublicado;
        if (this.programaPublicado) {
          this.actividadService.listar(1, 100).subscribe({
            next: (items) => {
              this.todasActividades = [...items].sort((a, b) => this.compararActividades(a, b));
            },
            error: (err) => {
              this.error = mensajeErrorApi(err, 'No se pudieron cargar las actividades del congreso.');
            },
          });
        }
        this.cargarCronograma();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar la configuración del congreso.');
        this.cargando = false;
      },
    });
  }

  actividadesAgendaPorFecha(fecha: string): Actividad[] {
    return (this.cronograma?.actividades ?? [])
      .filter((a) => fechaClaveActividad(a.inicio) === fecha)
      .sort((a, b) => this.compararActividades(a, b));
  }

  actividadesDisponiblesPorFecha(fecha: string): Actividad[] {
    return this.actividadesDisponibles.filter((a) => fechaClaveActividad(a.inicio) === fecha);
  }

  etiquetaFecha(fechaIso: string): string {
    return etiquetaFechaCongreso(fechaIso);
  }

  etiquetaTipo(tipo?: string): string {
    return tipo ? ETIQUETAS_TIPO[tipo] ?? tipo : 'Actividad';
  }

  /** "este taller", "esta mesa temática", etc. — para mensajes de error. */
  etiquetaTipoArticulo(tipo?: string): string {
    switch (tipo) {
      case 'MESA_TEMATICA':
        return 'esta mesa temática';
      case 'MESA_REDONDA':
        return 'esta mesa redonda';
      case 'POSTER':
        return 'esta sesión de pósters';
      case 'TALLER':
        return 'este taller';
      case 'CONFERENCIA':
        return 'esta conferencia';
      default:
        return 'esta actividad';
    }
  }

  claseTipo(tipo?: string): string {
    const map: Record<string, string> = {
      MESA_TEMATICA: 'agenda-card--mesa',
      MESA_REDONDA: 'agenda-card--redonda',
      POSTER: 'agenda-card--poster',
      TALLER: 'agenda-card--taller',
      CONFERENCIA: 'agenda-card--conferencia',
    };
    return map[tipo ?? ''] ?? '';
  }

  tituloActividad(a: Actividad): string {
    if (a.codigo && a.tipoActividad === 'MESA_TEMATICA') {
      return `${a.codigo} — ${a.titulo}`;
    }
    return a.titulo;
  }

  horario(a: Actividad): string {
    const hi = horaActividad(a.inicio);
    const hf = horaActividad(a.fin);
    return hf && hf !== '—' && hf !== hi ? `${hi} – ${hf}` : hi;
  }

  aulaDe(a: Actividad): Aula | null {
    if (a.aulaId == null) {
      return null;
    }
    return this.aulasPorId.get(a.aulaId) ?? null;
  }

  etiquetaCupo(a: Actividad): string | null {
    return etiquetaCupoAgenda(a);
  }

  cupoLleno(a: Actividad): boolean {
    return cupoAgendaCompleto(a);
  }

  agregar(actividad: Actividad): void {
    if (!this.usuarioId || !actividad.id || this.cupoLleno(actividad)) {
      return;
    }
    this.error = '';
    this.mensaje = '';
    this.procesandoAgregarId = actividad.id;
    this.cronogramaService.agregarActividad(this.usuarioId, actividad.id).subscribe({
      next: (c) => {
        this.cronograma = c;
        this.sincronizarOcupacionDesde(c.actividades ?? []);
        this.procesandoAgregarId = undefined;
        this.mensaje = `"${actividad.titulo}" agregada a tu agenda.`;
      },
      error: (err) => {
        this.procesandoAgregarId = undefined;
        this.error = mensajeErrorApi(
          err,
          `No se pudo agendar ${this.etiquetaTipoArticulo(actividad.tipoActividad)}.`
        );
      },
    });
  }

  quitar(actividad: Actividad): void {
    if (!this.usuarioId || !actividad.id) {
      return;
    }
    this.error = '';
    this.mensaje = '';
    this.procesandoQuitarId = actividad.id;
    this.cronogramaService.quitarActividad(this.usuarioId, actividad.id).subscribe({
      next: () => {
        const id = actividad.id!;
        this.cronograma = {
          ...this.cronograma!,
          actividades: (this.cronograma?.actividades ?? []).filter((a) => a.id !== id),
        };
        this.bumpOcupacionLocal(id, -1);
        this.procesandoQuitarId = undefined;
        this.mensaje = `"${actividad.titulo}" eliminada de tu agenda.`;
      },
      error: (err) => {
        this.procesandoQuitarId = undefined;
        this.error = mensajeErrorApi(err, 'No se pudo quitar la actividad.');
      },
    });
  }

  private sincronizarOcupacionDesde(items: Actividad[]): void {
    for (const a of items) {
      if (a.id == null) continue;
      this.todasActividades = this.todasActividades.map((t) =>
        t.id === a.id
          ? {
              ...t,
              agendasOcupacion: a.agendasOcupacion ?? t.agendasOcupacion,
              aulaCapacidad: a.aulaCapacidad ?? t.aulaCapacidad,
            }
          : t
      );
    }
  }

  private bumpOcupacionLocal(actividadId: number, delta: number): void {
    this.todasActividades = this.todasActividades.map((t) => {
      if (t.id !== actividadId) return t;
      const actual = t.agendasOcupacion ?? 0;
      return { ...t, agendasOcupacion: Math.max(0, actual + delta) };
    });
    if (this.cronograma?.actividades) {
      this.cronograma = {
        ...this.cronograma,
        actividades: this.cronograma.actividades.map((t) => {
          if (t.id !== actividadId) return t;
          const actual = t.agendasOcupacion ?? 0;
          return { ...t, agendasOcupacion: Math.max(0, actual + delta) };
        }),
      };
    }
  }

  private cargarCronograma(): void {
    if (!this.usuarioId) {
      return;
    }
    this.cargando = true;
    this.cronogramaService.obtener(this.usuarioId).subscribe({
      next: (c) => {
        this.cronograma = {
          ...c,
          actividades: [...(c.actividades ?? [])].sort((a, b) => this.compararActividades(a, b)),
        };
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar el cronograma.');
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
