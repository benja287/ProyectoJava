import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminStats } from '../../../models/notificacion.model';
import { Circular } from '../../../models/circular.model';
import { CongresoConfig } from '../../../models/congreso-config.model';
import { Usuario } from '../../../models/usuario.model';
import { AdminStatsService } from '../../../servicios/admin-stats.service';
import { CircularService } from '../../../servicios/circular.service';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { NotificacionService } from '../../../servicios/notificacion.service';
import { UsuarioService } from '../../../servicios/usuario.service';
import { UsuarioFilaComponent } from '../usuarios-lista/usuario-fila.component';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule, UsuarioFilaComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">⚙</span>
        <div>
          <h1>Panel de Administración</h1>
          <p>Gestión completa del congreso</p>
        </div>
      </div>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }
      @if (circularesFeedback) {
        <p [class]="circularesFeedback.includes('eliminada') ? 'error' : 'ok'">
          {{ circularesFeedback }}
        </p>
      }

      <div class="acciones-rapidas">
        <a routerLink="/admin/mesas-tematicas" class="accion-rapida accion-rapida--azul">Crear Mesa Temática</a>
        <a routerLink="/admin/mesas-redondas" class="accion-rapida accion-rapida--violeta">Crear Mesa Redonda</a>
        <a routerLink="/admin/sesion-posters" class="accion-rapida accion-rapida--naranja">Crear Sesión de Pósters</a>
        <a routerLink="/admin/crear-taller" class="accion-rapida accion-rapida--teal">Crear Taller</a>
        <a routerLink="/admin/crear-conferencia" class="accion-rapida accion-rapida--indigo">Crear Conferencia</a>
        <a routerLink="/asistente/certificado" class="accion-rapida accion-rapida--azul">Generar Certificado</a>
      </div>

      <div class="stats-grid">
        <div class="stat-card stat-card--gris">
          <span class="stat-label">Usuarios</span>
          <span class="stat-value">{{ stats?.totalUsuarios ?? '—' }}</span>
        </div>
        <div class="stat-card stat-card--amarillo">
          <span class="stat-label">Inscriptos adeudando pago</span>
          <span class="stat-value">{{ stats?.inscripcionesPendientesPago ?? '—' }}</span>
        </div>
        <div class="stat-card stat-card--verde">
          <span class="stat-label">Inscriptos confirmados</span>
          <span class="stat-value">{{ stats?.inscripcionesConfirmadas ?? '—' }}</span>
        </div>
        <div class="stat-card stat-card--violeta">
          <span class="stat-label">Trabajos presentados</span>
          <span class="stat-value">{{ stats?.trabajosPresentados ?? '—' }}</span>
        </div>
      </div>

      <section class="panel-card panel-card--indigo">
        <div class="panel-card-header-row">
          <div>
            <h2>Programa del congreso</h2>
            <p class="muted">
              Controlá si el programa está visible para el público. Mientras esté "No publicado",
              los visitantes verán un aviso de que aún no fue publicado.
            </p>
          </div>
          <button
            type="button"
            class="toggle-btn"
            [class.toggle-btn--on]="config?.programaPublicado"
            [disabled]="guardandoConfig"
            (click)="togglePrograma()"
          >
            {{ config?.programaPublicado ? 'Publicado' : 'No publicado' }}
          </button>
        </div>
        @if (config && !config.programaPublicado) {
          <p class="notice-box notice-box--amber">
            Mientras el programa esté "No publicado", el público verá el mensaje de aún no publicado.
          </p>
        }
      </section>

      <section class="panel-card panel-card--verde">
        <h2>Certificados de asistencia</h2>
        <p class="muted">
          Definí la fecha (inclusive) desde la cual los participantes podrán ver e imprimir el certificado.
        </p>
        <div class="inline-form-row">
          <label>
            Habilitar descarga desde
            <input type="date" [(ngModel)]="certificadosInput" [ngModelOptions]="{ standalone: true }" />
          </label>
          <button type="button" class="btn-primary" [disabled]="guardandoConfig" (click)="guardarCertificados()">
            Guardar fecha
          </button>
          <button type="button" class="btn-link" [disabled]="guardandoConfig" (click)="limpiarCertificados()">
            Sin fecha (descarga deshabilitada)
          </button>
        </div>
        <p class="muted small">
          Fecha guardada:
          {{
            config?.certificadosDisponiblesDesde
              ? formatFechaEs(config!.certificadosDisponiblesDesde!)
              : 'ninguna — nadie puede descargar hasta que definas una fecha.'
          }}
        </p>
      </section>

      <section class="panel-card">
        <h2>Validación de inscripciones</h2>
        <p class="muted">
          Revisá pagos por transferencia o efectivo y aprobá inscripciones. Al aprobar, el usuario recibe
          notificación y el rol <strong>Asistente</strong>.
        </p>
        <a routerLink="/admin/inscripciones" class="btn-primary">Ir a inscripciones</a>
        <a routerLink="/admin/pagos" class="btn-secundario">Validar pagos pendientes</a>
      </section>

      <section class="panel-card">
        <div class="panel-card-header-row">
          <div>
            <h2>Usuarios registrados</h2>
            <p class="muted">Gestioná cuentas, roles y habilitación de usuarios.</p>
          </div>
          <a routerLink="/admin/usuarios/nuevo" class="btn-secundario">+ Crear usuario</a>
        </div>

        @if (cargandoUsuarios) {
          <p>Cargando usuarios...</p>
        } @else if (!usuarios.length) {
          <p class="muted">No hay usuarios registrados.</p>
        } @else {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Apellido y nombre</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Roles</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (u of usuarios; track u.id) {
                  <app-usuario-fila [usuario]="u" (eliminar)="confirmarBaja($event)" />
                }
              </tbody>
            </table>
          </div>
        }
        <a routerLink="/admin/usuarios" class="btn-link">Ver listado completo →</a>
      </section>

      <section class="panel-card">
        <h2>Cronograma del congreso</h2>
        <p class="muted">Mesas temáticas, pósters, talleres y conferencias programadas.</p>
        <a routerLink="/admin/actividades" class="btn-primary">ABM actividades</a>
        <a routerLink="/admin/trabajos" class="btn-secundario">Listado de trabajos</a>
      </section>

      <section class="panel-card">
        <div class="panel-card-header-row">
          <div>
            <h2>Circulares</h2>
            <p class="muted">Publicá circulares para que se vean en la sección pública.</p>
          </div>
          <a routerLink="/admin/circulares/nueva" class="btn-primary">+ Nueva circular</a>
        </div>

        @if (cargandoCirculares) {
          <p>Cargando circulares...</p>
        } @else if (!circulares.length) {
          <p class="muted dashed-box">Todavía no cargaste circulares.</p>
        } @else {
          <div class="circular-admin-list">
            @for (c of circulares; track c.id) {
              <article class="circular-admin-item">
                <div>
                  <div class="circular-admin-meta">
                    <span class="badge" [class.badge-ok]="c.publicada" [class.badge-off]="!c.publicada">
                      {{ c.publicada ? 'Publicada' : 'Borrador' }}
                    </span>
                    @if (c.fechaPublicacion) {
                      <span class="muted small">{{ c.fechaPublicacion }}</span>
                    }
                  </div>
                  <h3>{{ c.titulo }}</h3>
                  <p class="muted circular-snippet">{{ c.contenido }}</p>
                </div>
                <div class="circular-admin-actions">
                  <a [routerLink]="['/admin/circulares/editar', c.id]" class="btn-secundario">Editar</a>
                  <button
                    type="button"
                    class="btn-secundario"
                    [disabled]="accionCircularId === c.id"
                    (click)="togglePublicacion(c)"
                  >
                    {{ c.publicada ? 'Despublicar' : 'Publicar' }}
                  </button>
                  <button
                    type="button"
                    class="btn-link danger"
                    [disabled]="accionCircularId === c.id"
                    (click)="eliminarCircular(c)"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            }
          </div>
        }
      </section>

      <section class="panel-card panel-card--violeta">
        <div class="panel-card-header-row">
          <div>
            <h2>Estadísticas y reportes</h2>
            <p class="muted">Vista ejecutiva de inscripciones y trabajos para seguimiento operativo.</p>
          </div>
          <a routerLink="/admin/estadisticas" class="btn-primary">Ver estadísticas</a>
        </div>
      </section>

      <section class="panel-card panel-card--violeta">
        <h2>🔔 Enviar notificación</h2>
        <p class="muted">Avisá a todos los usuarios o filtrá por rol (asistente, autor, evaluador, organizador).</p>
        <form [formGroup]="notifForm" (ngSubmit)="enviarNotificacion()" class="form-grid form-grid-wide">
          <label>
            Título
            <input formControlName="asunto" placeholder="Título de la notificación" />
          </label>
          <label>
            Mensaje
            <textarea formControlName="mensaje" rows="3" placeholder="Mensaje"></textarea>
          </label>
          <label>
            Destinatarios
            <select formControlName="rol">
              <option value="TODOS">Todos</option>
              <option value="ASISTENTE">Asistentes</option>
              <option value="AUTOR">Autores</option>
              <option value="EVALUADOR">Evaluadores</option>
              <option value="ORGANIZADOR_CIENTIFICO">Organizador científico</option>
            </select>
          </label>
          <button type="submit" class="btn-primary-full" [disabled]="notifForm.invalid || enviandoNotif">
            {{ enviandoNotif ? 'Enviando...' : 'Enviar' }}
          </button>
        </form>
      </section>
    </div>
  `,
})
export class PanelAdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  stats?: AdminStats;
  config?: CongresoConfig;
  certificadosInput = '';
  usuarios: Usuario[] = [];
  circulares: Circular[] = [];
  error = '';
  mensaje = '';
  circularesFeedback = '';
  enviandoNotif = false;
  guardandoConfig = false;
  cargandoUsuarios = true;
  cargandoCirculares = true;
  accionCircularId?: number;

  notifForm = this.fb.group({
    asunto: ['', Validators.required],
    mensaje: ['', Validators.required],
    rol: ['TODOS'],
  });

  constructor(
    private statsService: AdminStatsService,
    private notificacionService: NotificacionService,
    private congresoConfigService: CongresoConfigService,
    private circularService: CircularService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    const st = history.state as { circularesFeedback?: string; mensaje?: string } | null;
    if (st?.circularesFeedback) {
      this.circularesFeedback = st.circularesFeedback;
    }
    if (st?.mensaje) {
      this.mensaje = st.mensaje;
    }
    if (st?.circularesFeedback || st?.mensaje) {
      history.replaceState({}, '');
    }

    this.statsService.obtener().subscribe({
      next: (s) => (this.stats = s),
      error: () => (this.stats = undefined),
    });

    this.congresoConfigService.obtener().subscribe({
      next: (c) => {
        this.config = c;
        this.certificadosInput = c.certificadosDisponiblesDesde ?? '';
      },
      error: () => (this.config = undefined),
    });

    this.usuarioService.listar(1, 15).subscribe({
      next: (u) => {
        this.usuarios = u;
        this.cargandoUsuarios = false;
      },
      error: () => {
        this.cargandoUsuarios = false;
      },
    });

    this.cargarCirculares();
  }

  togglePrograma(): void {
    if (!this.config || this.guardandoConfig) return;
    this.guardandoConfig = true;
    this.congresoConfigService
      .actualizar({ programaPublicado: !this.config.programaPublicado })
      .subscribe({
        next: (c) => {
          this.config = c;
          this.guardandoConfig = false;
          this.mensaje = c.programaPublicado
            ? 'El programa quedó publicado.'
            : 'El programa quedó como no publicado.';
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo actualizar el programa.');
          this.guardandoConfig = false;
        },
      });
  }

  guardarCertificados(): void {
    if (this.guardandoConfig) return;
    this.guardandoConfig = true;
    this.congresoConfigService
      .actualizar({ certificadosDisponiblesDesde: this.certificadosInput.trim() || null })
      .subscribe({
        next: (c) => {
          this.config = c;
          this.certificadosInput = c.certificadosDisponiblesDesde ?? '';
          this.guardandoConfig = false;
          this.mensaje = 'Fecha de certificados guardada.';
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo guardar la fecha.');
          this.guardandoConfig = false;
        },
      });
  }

  limpiarCertificados(): void {
    this.certificadosInput = '';
    this.guardarCertificados();
  }

  formatFechaEs(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  confirmarBaja(usuario: Usuario): void {
    if (!usuario.id || !confirm(`¿Dar de baja a ${usuario.email}?`)) return;
    this.usuarioService.baja(usuario.id).subscribe({
      next: () => {
        this.mensaje = `Usuario ${usuario.id} eliminado.`;
        this.usuarios = this.usuarios.filter((u) => u.id !== usuario.id);
        this.statsService.obtener().subscribe({ next: (s) => (this.stats = s) });
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar el usuario.');
      },
    });
  }

  togglePublicacion(c: Circular): void {
    if (!c.id) return;
    this.accionCircularId = c.id;
    this.circularService.alternarPublicacion(c.id).subscribe({
      next: (actualizada) => {
        this.circulares = this.circulares.map((x) => (x.id === actualizada.id ? actualizada : x));
        this.circularesFeedback = actualizada.publicada
          ? 'La circular fue publicada correctamente.'
          : 'La circular fue guardada como borrador.';
        this.accionCircularId = undefined;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cambiar el estado de la circular.');
        this.accionCircularId = undefined;
      },
    });
  }

  eliminarCircular(c: Circular): void {
    if (!c.id || !confirm(`¿Eliminar la circular "${c.titulo}"?`)) return;
    this.accionCircularId = c.id;
    this.circularService.eliminar(c.id).subscribe({
      next: () => {
        this.circulares = this.circulares.filter((x) => x.id !== c.id);
        this.circularesFeedback = 'La circular fue eliminada.';
        this.accionCircularId = undefined;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar la circular.');
        this.accionCircularId = undefined;
      },
    });
  }

  enviarNotificacion(): void {
    if (this.notifForm.invalid) return;
    const raw = this.notifForm.getRawValue();
    this.enviandoNotif = true;
    this.error = '';
    this.notificacionService
      .enviar(raw.asunto!, raw.mensaje!, raw.rol || 'TODOS')
      .subscribe({
        next: (r) => {
          this.mensaje = `Notificación enviada a ${r.enviadas} usuario(s).`;
          this.enviandoNotif = false;
          this.notifForm.reset({ rol: 'TODOS' });
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo enviar la notificación.');
          this.enviandoNotif = false;
        },
      });
  }

  private cargarCirculares(): void {
    this.circularService.listarAdmin(1, 50).subscribe({
      next: (items) => {
        this.circulares = items;
        this.cargandoCirculares = false;
      },
      error: () => {
        this.cargandoCirculares = false;
      },
    });
  }
}
