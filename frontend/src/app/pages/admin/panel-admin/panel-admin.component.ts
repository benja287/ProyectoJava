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
import { UsuarioEdicionDialogService } from '../../../servicios/usuario-edicion-dialog.service';
import { UsuarioFilaComponent } from '../usuarios-lista/usuario-fila.component';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { SolicitudAutor } from '../../../models/solicitud-autor.model';
import { Trabajo } from '../../../models/trabajo.model';
import { Pago } from '../../../models/pago.model';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { CronogramaCongresoAdminComponent } from '../cronograma-congreso/cronograma-congreso-admin.component';
import { PagoService } from '../../../servicios/pago.service';
import { ArchivoService } from '../../../servicios/archivo.service';

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    UsuarioFilaComponent,
    ArchivoLinkComponent,
    CronogramaCongresoAdminComponent,
  ],
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
            El cronograma ya está cargado en admin, pero el público aún no lo ve. Hacé clic en
            <strong>Publicar programa</strong> para que aparezca en la cabecera → Programa.
          </p>
          <button
            type="button"
            class="btn-primary"
            [disabled]="guardandoConfig"
            (click)="publicarPrograma()"
          >
            Publicar programa ahora
          </button>
        } @else if (config?.programaPublicado) {
          <p class="ok">El programa está visible para todos en <strong>Programa</strong>.</p>
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

      <section class="panel-card panel-card--indigo">
        <h2>Ventanas de tiempo del congreso</h2>
        <p class="muted">
          Fechas configurables sin tocar código. Vacío = sin límite. Si el congreso se posterga, actualizá
          estas fechas acá.
        </p>
        <div class="form-grid form-grid-wide">
          <label>
            Inicio del congreso
            <input type="date" [(ngModel)]="ventanas.congresoDesde" [ngModelOptions]="{ standalone: true }" />
          </label>
          <label>
            Fin del congreso
            <input type="date" [(ngModel)]="ventanas.congresoHasta" [ngModelOptions]="{ standalone: true }" />
          </label>
          <label>
            Inscripciones desde
            <input
              type="date"
              [(ngModel)]="ventanas.inscripcionesDesde"
              [ngModelOptions]="{ standalone: true }"
            />
          </label>
          <label>
            Inscripciones hasta
            <input
              type="date"
              [(ngModel)]="ventanas.inscripcionesHasta"
              [ngModelOptions]="{ standalone: true }"
            />
          </label>
          <label>
            Envío de trabajos hasta
            <input
              type="date"
              [(ngModel)]="ventanas.envioTrabajosHasta"
              [ngModelOptions]="{ standalone: true }"
            />
          </label>
          <label>
            Evaluación hasta
            <input type="date" [(ngModel)]="ventanas.evaluacionHasta" [ngModelOptions]="{ standalone: true }" />
          </label>
        </div>
        <div class="inline-form-row" style="margin-top: 0.75rem">
          <button type="button" class="btn-primary" [disabled]="guardandoConfig" (click)="guardarVentanas()">
            Guardar ventanas
          </button>
          <button type="button" class="btn-link" [disabled]="guardandoConfig" (click)="limpiarVentanas()">
            Limpiar todas
          </button>
        </div>
        <p class="muted small">
          El comité también puede editar solo la fecha límite de envío de trabajos desde su panel.
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

      <section class="panel-card panel-card--limpieza">
        <h2>Limpieza de datos</h2>
        <p class="muted">
          Eliminá trabajos o pagos de prueba. La baja es permanente (incluye archivos adjuntos cuando
          corresponda).
        </p>
        @if (limpiezaFeedback) {
          <p class="ok">{{ limpiezaFeedback }}</p>
        }

        <div class="limpieza-grid">
          <div class="limpieza-bloque">
            <div class="limpieza-bloque-header">
              <h3>Trabajos</h3>
              <a routerLink="/admin/trabajos" class="btn-link">Ver listado completo →</a>
            </div>
            @if (cargandoTrabajosLimpieza) {
              <p class="muted">Cargando trabajos...</p>
            } @else if (trabajosLimpieza.length === 0) {
              <p class="muted dashed-box">No hay trabajos registrados.</p>
            } @else {
              <div class="table-wrap">
                <table class="limpieza-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Título</th>
                      <th>Estado</th>
                      <th>PDF</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (t of trabajosLimpieza; track t.id) {
                      <tr>
                        <td>{{ t.id }}</td>
                        <td>{{ t.titulo }}</td>
                        <td>{{ t.estado }}</td>
                        <td>
                          @if (t.documentoUrl) {
                            <app-archivo-link [url]="t.documentoUrl" label="Ver" />
                          } @else {
                            —
                          }
                        </td>
                        <td>
                          <button type="button" class="btn-warn" (click)="eliminarTrabajo(t)">
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <p class="muted small">Mostrando los últimos {{ trabajosLimpieza.length }} trabajos.</p>
            }
          </div>

          <div class="limpieza-bloque">
            <div class="limpieza-bloque-header">
              <h3>Pagos</h3>
              <a routerLink="/admin/pagos/todos" class="btn-link">Ver listado completo →</a>
            </div>
            @if (cargandoPagosLimpieza) {
              <p class="muted">Cargando pagos...</p>
            } @else if (pagosLimpieza.length === 0) {
              <p class="muted dashed-box">No hay pagos registrados.</p>
            } @else {
              <div class="table-wrap">
                <table class="limpieza-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Comprobante</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of pagosLimpieza; track p.id) {
                      <tr>
                        <td>{{ p.id }}</td>
                        <td>{{ p.monto | number: '1.2-2' }}</td>
                        <td>{{ p.estado }}</td>
                        <td>
                          @if (p.comprobanteUrl) {
                            <app-archivo-link [url]="p.comprobanteUrl" label="Ver" />
                          } @else {
                            —
                          }
                        </td>
                        <td>
                          <button type="button" class="btn-warn" (click)="eliminarPago(p)">
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <p class="muted small">Mostrando los últimos {{ pagosLimpieza.length }} pagos.</p>
            }
          </div>

          <div class="limpieza-bloque">
            <div class="limpieza-bloque-header">
              <h3>Historial de emails</h3>
              <a routerLink="/admin/emails" class="btn-link">Ver historial completo →</a>
            </div>
            <p class="muted small">
              Correos enviados por precheck, evaluaciones, inscripciones y otras acciones del sistema.
              Podés liberar espacio en la base eliminando registros de prueba o fallidos.
              Las plantillas reutilizables no se borran con esa limpieza.
            </p>
            <a routerLink="/admin/emails" class="btn-secundario">Gestionar emails</a>
          </div>

          <div class="limpieza-bloque">
            <div class="limpieza-bloque-header">
              <h3>Archivos huérfanos</h3>
            </div>
            @if (cargandoArchivosHuerfanos) {
              <p class="muted">Detectando archivos sin referencia...</p>
            } @else {
              <p class="muted small">
                PDFs y comprobantes guardados en la base que ya no están vinculados a ningún trabajo,
                pago, inscripción ni circular (por ejemplo, tras reemplazar un documento).
              </p>
              <p class="limpieza-archivos-count">
                Detectados: <strong>{{ archivosHuerfanos }}</strong>
              </p>
              <button
                type="button"
                class="btn-warn"
                [disabled]="limpiandoArchivosHuerfanos || archivosHuerfanos === 0"
                (click)="limpiarArchivosHuerfanos()"
              >
                {{ limpiandoArchivosHuerfanos ? 'Limpiando...' : 'Eliminar archivos huérfanos' }}
              </button>
            }
          </div>
        </div>
      </section>

      <section class="panel-card panel-card--verde">
        <h2>Solicitudes para ser Autor</h2>
        <p class="muted">
          Acá aparecen solo asistentes con al menos un trabajo
          <strong>aprobado</strong> por evaluadores (2 aprobaciones) y pendientes de habilitación
          del rol autor.
        </p>
        @if (solicitudesAutorFeedback) {
          <p class="ok">{{ solicitudesAutorFeedback }}</p>
        }
        @if (cargandoSolicitudesAutor) {
          <p class="muted">Cargando solicitudes...</p>
        } @else if (solicitudesAutor.length === 0) {
          <p class="muted dashed-box">No hay solicitudes pendientes.</p>
        } @else {
          <div class="solicitudes-autor-lista">
            @for (s of solicitudesAutor; track s.usuarioId) {
              <article class="solicitud-autor-card">
                <div>
                  <strong>{{ s.nombre }} {{ s.apellido }}</strong>
                  <p class="muted small">{{ s.email }}</p>
                  <p class="solicitud-autor-trabajos-titulo">Trabajos aprobados:</p>
                  <ul class="solicitud-autor-trabajos">
                    @for (t of s.trabajos; track t.id) {
                      <li>
                        <span class="solicitud-autor-trabajo-titulo">{{ t.titulo }}</span>
                        <span class="muted small">
                          — {{ t.ejeTematico || '—' }} —
                          {{ etiquetaTipoTrabajo(t.tipo) }}
                          @if (t.estado) {
                            ({{ etiquetaEstadoTrabajo(t.estado) }})
                          }
                        </span>
                      </li>
                    }
                  </ul>
                </div>
                <button
                  type="button"
                  class="btn-ok"
                  [disabled]="procesandoAutorId === s.usuarioId"
                  (click)="habilitarAutor(s)"
                >
                  Habilitar rol Autor
                </button>
              </article>
            }
          </div>
        }
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
                  <app-usuario-fila
                    [usuario]="u"
                    (editar)="abrirEdicionUsuario($event)"
                    (toggleActivo)="toggleActivoUsuario($event)"
                    (eliminar)="confirmarBaja($event)"
                  />
                }
              </tbody>
            </table>
          </div>
        }
        <a routerLink="/admin/usuarios" class="btn-link">Ver listado completo →</a>
      </section>

      <section class="panel-card" id="cronograma-congreso">
        <h2>Cronograma del congreso</h2>
        <p class="muted">Mesas temáticas, pósters, talleres y conferencias programadas.</p>
        <app-cronograma-congreso-admin />
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
                  @if (c.resumen) {
                    <p class="muted circular-snippet">{{ c.resumen }}</p>
                  } @else if (c.contenido) {
                    <p class="muted circular-snippet">{{ c.contenido }}</p>
                  }
                  @if (c.documentoNombre) {
                    <p class="muted small circular-pdf-name">PDF: {{ c.documentoNombre }}</p>
                  }
                  @if (c.documentoUrl) {
                    <p class="circular-pdf-link">
                      <app-archivo-link [url]="c.documentoUrl" label="Ver PDF" />
                    </p>
                  }
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
  ventanas = {
    congresoDesde: '',
    congresoHasta: '',
    inscripcionesDesde: '',
    inscripcionesHasta: '',
    envioTrabajosHasta: '',
    evaluacionHasta: '',
  };
  usuarios: Usuario[] = [];
  circulares: Circular[] = [];
  solicitudesAutor: SolicitudAutor[] = [];
  solicitudesAutorFeedback = '';
  trabajosLimpieza: Trabajo[] = [];
  pagosLimpieza: Pago[] = [];
  cargandoTrabajosLimpieza = true;
  cargandoPagosLimpieza = true;
  cargandoArchivosHuerfanos = true;
  limpiandoArchivosHuerfanos = false;
  archivosHuerfanos = 0;
  limpiezaFeedback = '';
  error = '';
  mensaje = '';
  circularesFeedback = '';
  enviandoNotif = false;
  guardandoConfig = false;
  cargandoUsuarios = true;
  cargandoCirculares = true;
  cargandoSolicitudesAutor = true;
  procesandoAutorId?: number;
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
    private usuarioService: UsuarioService,
    private usuarioEdicionDialog: UsuarioEdicionDialogService,
    private trabajoService: TrabajoService,
    private pagoService: PagoService,
    private archivoService: ArchivoService
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
        this.aplicarVentanasDesdeConfig(c);
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
    this.cargarSolicitudesAutor();
    this.cargarLimpieza();
  }

  eliminarTrabajo(t: Trabajo): void {
    if (!t.id || !confirm(`¿Eliminar trabajo #${t.id} "${t.titulo}"?`)) {
      return;
    }
    this.limpiezaFeedback = '';
    this.error = '';
    this.trabajoService.baja(t.id).subscribe({
      next: () => {
        this.limpiezaFeedback = `Trabajo #${t.id} eliminado (incluye PDF si tenía).`;
        this.trabajosLimpieza = this.trabajosLimpieza.filter((x) => x.id !== t.id);
        this.statsService.obtener().subscribe({ next: (s) => (this.stats = s) });
        this.archivoService.resumenHuerfanos().subscribe({
          next: (r) => (this.archivosHuerfanos = r.huerfanosRestantes),
        });
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar el trabajo.');
      },
    });
  }

  eliminarPago(p: Pago): void {
    if (!p.id || !confirm(`¿Eliminar pago #${p.id}?`)) {
      return;
    }
    this.limpiezaFeedback = '';
    this.error = '';
    this.pagoService.baja(p.id).subscribe({
      next: () => {
        this.limpiezaFeedback = `Pago #${p.id} eliminado.`;
        this.pagosLimpieza = this.pagosLimpieza.filter((x) => x.id !== p.id);
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar el pago.');
      },
    });
  }

  limpiarArchivosHuerfanos(): void {
    if (
      this.archivosHuerfanos === 0 ||
      !confirm(`¿Eliminar ${this.archivosHuerfanos} archivo(s) huérfano(s) de la base?`)
    ) {
      return;
    }
    this.limpiezaFeedback = '';
    this.error = '';
    this.limpiandoArchivosHuerfanos = true;
    this.archivoService.limpiarHuerfanos().subscribe({
      next: (r) => {
        this.archivosHuerfanos = r.huerfanosRestantes;
        this.limpiezaFeedback = r.mensaje;
        this.limpiandoArchivosHuerfanos = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron eliminar los archivos huérfanos.');
        this.limpiandoArchivosHuerfanos = false;
      },
    });
  }

  private cargarLimpieza(): void {
    this.archivoService.resumenHuerfanos().subscribe({
      next: (r) => {
        this.archivosHuerfanos = r.huerfanosRestantes;
        this.cargandoArchivosHuerfanos = false;
      },
      error: () => {
        this.cargandoArchivosHuerfanos = false;
      },
    });
    this.trabajoService.listar(1, 20).subscribe({
      next: (items) => {
        this.trabajosLimpieza = items;
        this.cargandoTrabajosLimpieza = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar trabajos para limpieza.');
        this.cargandoTrabajosLimpieza = false;
      },
    });
    this.pagoService.listar(1, 20).subscribe({
      next: (items) => {
        this.pagosLimpieza = items;
        this.cargandoPagosLimpieza = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar pagos para limpieza.');
        this.cargandoPagosLimpieza = false;
      },
    });
  }

  etiquetaTipoTrabajo(tipo?: string): string {
    const map: Record<string, string> = {
      TRABAJO_CIENTIFICO: 'Científico',
      RELATO_DE_EXPERIENCIA: 'Relato de experiencia',
    };
    return tipo ? map[tipo] ?? tipo : '—';
  }

  etiquetaEstadoTrabajo(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE_APROBACION_COMITE: 'Pendiente comité',
      APROBADO: 'Aprobado',
    };
    return map[estado] ?? estado;
  }

  habilitarAutor(solicitud: SolicitudAutor): void {
    if (
      !confirm(
        `¿Habilitar rol Autor para ${solicitud.nombre} ${solicitud.apellido}?`
      )
    ) {
      return;
    }
    this.procesandoAutorId = solicitud.usuarioId;
    this.solicitudesAutorFeedback = '';
    this.error = '';
    this.usuarioService.promoverAutor(solicitud.usuarioId).subscribe({
      next: () => {
        this.solicitudesAutorFeedback = `Se habilitó el rol autor para ${solicitud.nombre} ${solicitud.apellido}.`;
        this.procesandoAutorId = undefined;
        this.cargarSolicitudesAutor();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo habilitar el rol autor.');
        this.procesandoAutorId = undefined;
      },
    });
  }

  private cargarSolicitudesAutor(): void {
    this.statsService.solicitudesAutor().subscribe({
      next: (items) => {
        this.solicitudesAutor = items;
        this.cargandoSolicitudesAutor = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar las solicitudes de autor.');
        this.cargandoSolicitudesAutor = false;
      },
    });
  }

  togglePrograma(): void {
    if (!this.config || this.guardandoConfig) return;
    this.actualizarProgramaPublicado(!this.config.programaPublicado);
  }

  publicarPrograma(): void {
    if (!this.config || this.guardandoConfig || this.config.programaPublicado) return;
    this.actualizarProgramaPublicado(true);
  }

  private actualizarProgramaPublicado(publicado: boolean): void {
    this.guardandoConfig = true;
    this.congresoConfigService
      .actualizar({ programaPublicado: publicado })
      .subscribe({
        next: (c) => {
          this.config = c;
          this.guardandoConfig = false;
          this.mensaje = c.programaPublicado
            ? 'El programa quedó publicado. Abrí Programa en la cabecera para verificar.'
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

  guardarVentanas(): void {
    if (this.guardandoConfig) return;
    this.guardandoConfig = true;
    this.error = '';
    this.congresoConfigService
      .actualizar({
        congresoDesde: this.ventanas.congresoDesde.trim() || '',
        congresoHasta: this.ventanas.congresoHasta.trim() || '',
        inscripcionesDesde: this.ventanas.inscripcionesDesde.trim() || '',
        inscripcionesHasta: this.ventanas.inscripcionesHasta.trim() || '',
        envioTrabajosHasta: this.ventanas.envioTrabajosHasta.trim() || '',
        evaluacionHasta: this.ventanas.evaluacionHasta.trim() || '',
      })
      .subscribe({
        next: (c) => {
          this.config = c;
          this.aplicarVentanasDesdeConfig(c);
          this.guardandoConfig = false;
          this.mensaje = 'Ventanas de tiempo del congreso guardadas.';
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudieron guardar las ventanas.');
          this.guardandoConfig = false;
        },
      });
  }

  limpiarVentanas(): void {
    this.ventanas = {
      congresoDesde: '',
      congresoHasta: '',
      inscripcionesDesde: '',
      inscripcionesHasta: '',
      envioTrabajosHasta: '',
      evaluacionHasta: '',
    };
    this.guardarVentanas();
  }

  private aplicarVentanasDesdeConfig(c: CongresoConfig): void {
    this.ventanas = {
      congresoDesde: c.congresoDesde ?? '',
      congresoHasta: c.congresoHasta ?? '',
      inscripcionesDesde: c.inscripcionesDesde ?? '',
      inscripcionesHasta: c.inscripcionesHasta ?? '',
      envioTrabajosHasta: c.envioTrabajosHasta ?? '',
      evaluacionHasta: c.evaluacionHasta ?? '',
    };
  }

  formatFechaEs(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  abrirEdicionUsuario(usuario: Usuario): void {
    this.usuarioEdicionDialog.abrir(usuario).subscribe((actualizado) => {
      if (actualizado) {
        this.reemplazarUsuarioEnLista(actualizado);
        this.mensaje = `Usuario #${actualizado.id} actualizado.`;
        this.error = '';
      }
    });
  }

  toggleActivoUsuario(usuario: Usuario): void {
    if (!usuario.id) return;
    const nuevoEstado = !usuario.activo;
    const accion = nuevoEstado ? 'habilitar' : 'inhabilitar';
    if (!confirm(`¿${accion} la cuenta de ${usuario.email}?`)) return;
    this.usuarioService.setActivo(usuario.id, nuevoEstado).subscribe({
      next: (actualizado) => {
        this.reemplazarUsuarioEnLista(actualizado);
        this.mensaje = nuevoEstado ? 'Cuenta habilitada.' : 'Cuenta inhabilitada.';
        this.error = '';
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cambiar el estado de la cuenta.');
      },
    });
  }

  confirmarBaja(usuario: Usuario): void {
    if (!usuario.id || !confirm(`¿Eliminar definitivamente a ${usuario.email}?`)) return;
    this.usuarioService.baja(usuario.id).subscribe({
      next: () => {
        this.mensaje = `Usuario ${usuario.id} eliminado.`;
        this.usuarios = this.usuarios.filter((u) => u.id !== usuario.id);
        this.statsService.obtener().subscribe({ next: (s) => (this.stats = s) });
        this.error = '';
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo eliminar el usuario.');
      },
    });
  }

  private reemplazarUsuarioEnLista(actualizado: Usuario): void {
    const idx = this.usuarios.findIndex((u) => u.id === actualizado.id);
    if (idx >= 0) {
      const copia = [...this.usuarios];
      copia[idx] = actualizado;
      this.usuarios = copia;
    }
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
