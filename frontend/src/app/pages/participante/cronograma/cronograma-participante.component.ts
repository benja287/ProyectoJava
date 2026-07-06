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
import { formatFechaActividad } from '../../../utils/fecha.util';

@Component({
  selector: 'app-cronograma-participante',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="card">
      <h1>Mi agenda</h1>
      <p class="muted">
        Rol <strong>{{ etiquetaPerfil }}</strong> — actividades que agregaste al cronograma del congreso.
      </p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (cargando) {
        <p>Cargando...</p>
      } @else if (!programaPublicado) {
        <div class="panel-card programa-empty">
          <p>El programa aún no fue publicado por el organizador.</p>
          <p class="muted small">
            Cuando el administrador publique el cronograma, vas a poder ver las actividades y armar tu agenda personal.
          </p>
          <a routerLink="/programa" class="btn-secundario">Ver programa del congreso</a>
        </div>
      } @else {
        <h2>Actividades en mi agenda</h2>
        @if (!cronograma?.actividades?.length) {
          <p>Tu cronograma está vacío. Podés sumar actividades desde el programa del congreso.</p>
        } @else {
          <ul class="menu">
            @for (a of cronograma!.actividades; track a.id) {
              <li>
                <strong>{{ a.titulo }}</strong> — {{ formatFecha(a.inicio) }} ({{ a.sala || 'sin sala' }})
                <button type="button" class="btn-link" (click)="quitar(a)">Quitar</button>
              </li>
            }
          </ul>
        }

        <h2>Agregar actividad del congreso</h2>
        @if (actividadesDisponibles.length === 0) {
          <p>No hay más actividades para agregar.</p>
        } @else {
          <ul class="menu">
            @for (a of actividadesDisponibles; track a.id) {
              <li>
                {{ a.titulo }} ({{ a.tipoActividad }}) — {{ formatFecha(a.inicio) }}
                <button type="button" (click)="agregar(a)">Agregar</button>
              </li>
            }
          </ul>
        }
      }

      <p><a [routerLink]="panelRoute">← {{ etiquetaVolver }}</a></p>
    </section>
  `,
})
export class CronogramaParticipanteComponent implements OnInit {
  cronograma?: Cronograma;
  todasActividades: Actividad[] = [];
  programaPublicado = false;
  cargando = true;
  error = '';
  mensaje = '';
  usuarioId?: number;
  perfilParticipante: 'asistente' | 'autor' = 'asistente';
  panelRoute = '/asistente';
  etiquetaVolver = 'Panel asistente';

  get etiquetaPerfil(): string {
    return this.perfilParticipante;
  }

  get actividadesDisponibles(): Actividad[] {
    const enCronograma = new Set(this.cronograma?.actividades?.map((a) => a.id));
    return this.todasActividades.filter((a) => a.id && !enCronograma.has(a.id));
  }

  constructor(
    private loginService: LoginService,
    private cronogramaService: CronogramaService,
    private actividadService: ActividadService,
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
    this.congresoConfigService.obtener().subscribe({
      next: (config) => {
        this.programaPublicado = config.programaPublicado;
        if (this.programaPublicado) {
          this.actividadService.listar(1, 100).subscribe({
            next: (items) => (this.todasActividades = items),
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

  formatFecha(valor: unknown): string {
    return formatFechaActividad(valor);
  }

  agregar(actividad: Actividad): void {
    if (!this.usuarioId || !actividad.id) {
      return;
    }
    this.error = '';
    this.mensaje = '';
    this.cronogramaService.agregarActividad(this.usuarioId, actividad.id).subscribe({
      next: (c) => {
        this.cronograma = c;
        this.mensaje = 'Actividad agregada.';
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo agregar la actividad.');
      },
    });
  }

  quitar(actividad: Actividad): void {
    if (!this.usuarioId || !actividad.id) {
      return;
    }
    this.error = '';
    this.mensaje = '';
    this.cronogramaService.quitarActividad(this.usuarioId, actividad.id).subscribe({
      next: () => {
        this.mensaje = 'Actividad quitada.';
        this.cargarCronograma();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo quitar la actividad.');
      },
    });
  }

  private cargarCronograma(): void {
    if (!this.usuarioId) {
      return;
    }
    this.cargando = true;
    this.cronogramaService.obtener(this.usuarioId).subscribe({
      next: (c) => {
        this.cronograma = c;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar el cronograma.');
        this.cargando = false;
      },
    });
  }
}
