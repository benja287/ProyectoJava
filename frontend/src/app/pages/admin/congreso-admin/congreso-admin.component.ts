import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CongresoConfig } from '../../../models/congreso-config.model';
import { Aula } from '../../../models/aula.model';
import { CongresoConfigService } from '../../../servicios/congreso-config.service';
import { AulaService } from '../../../servicios/aula.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { finCongresoDesdeInicio } from '../../../constants/congress-event';
import { etiquetaMapaAula, urlMapaAula } from '../../../utils/aula-mapa.util';
import {
  SedeMapaComponent,
  AulaMapaPunto,
} from '../../../components/aula-mapa/sede-mapa.component';
import { centroDesdeConfig } from '../../../constants/sede-mapa';
import { CronogramaCongresoAdminComponent } from '../cronograma-congreso/cronograma-congreso-admin.component';

@Component({
  selector: 'app-congreso-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CronogramaCongresoAdminComponent,
    SedeMapaComponent,
  ],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">📅</span>
        <div>
          <h1>Congreso</h1>
          <p>Datos, aulas, fechas, certificados y cronograma</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin">← Volver al panel</a></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <section class="panel-card panel-card--indigo">
        <h2>Datos del congreso</h2>
        <p class="muted">Nombre, edición y sede (aparecen en cabecera, inicio y certificados).</p>
        <div class="form-grid form-grid-wide">
          <label class="span-full">
            Nombre
            <input
              type="text"
              [(ngModel)]="datos.nombre"
              [ngModelOptions]="{ standalone: true }"
              placeholder="Congreso Argentino de Agroecología"
            />
          </label>
          <label>
            Edición
            <input
              type="text"
              [(ngModel)]="datos.edicion"
              [ngModelOptions]="{ standalone: true }"
              placeholder="V"
            />
          </label>
          <label>
            Sede
            <input
              type="text"
              [(ngModel)]="datos.sede"
              [ngModelOptions]="{ standalone: true }"
              placeholder="La Plata"
            />
          </label>
        </div>
        <div class="inline-form-row" style="margin-top: 0.75rem">
          <button
            type="button"
            class="btn-primary"
            [disabled]="guardandoVentana === 'DATOS'"
            (click)="guardarDatos()"
          >
            {{ guardandoVentana === 'DATOS' ? 'Guardando...' : 'Guardar datos' }}
          </button>
        </div>
        @if (feedbackDatos) {
          <p [class]="feedbackDatosOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
            {{ feedbackDatos }}
          </p>
        }

        <h3 style="margin-top: 1.25rem">Ubicación en el mapa</h3>
        <p class="muted small">
          Definí el punto de la sede. Al verla se aplica un rango alrededor; las aulas solo pueden
          ubicarse dentro de ese rango.
        </p>
        <div class="inline-form-row" style="margin-top: 0.5rem">
          <button
            type="button"
            class="btn-link"
            [disabled]="!centroSede"
            (click)="abrirMapaCongreso('ver')"
          >
            Ver ubicación del congreso en el mapa
          </button>
          <button type="button" class="btn-link" (click)="abrirMapaCongreso('editar')">
            Editar ubicación
          </button>
          @if (mapaCongresoModo) {
            <button type="button" class="btn-link" (click)="cerrarMapaCongreso()">
              Cerrar mapa
            </button>
          }
        </div>
        @if (centroSede) {
          <p class="muted small" style="margin-top: 0.35rem">
            Centro guardado: {{ centroSede.lat | number: '1.5-5' }},
            {{ centroSede.lng | number: '1.5-5' }}
          </p>
        } @else {
          <p class="muted small" style="margin-top: 0.35rem">
            Todavía no hay coordenadas. Usá «Editar ubicación» y hacé clic en el mapa.
          </p>
        }

        @if (mapaCongresoModo === 'ver' && centroSede) {
          <app-sede-mapa
            modo="acotado"
            [centro]="centroSede"
            [seleccion]="centroSede"
            [editable]="false"
            [mostrarMiUbicacion]="true"
            ariaLabel="Ubicación del congreso (rango acotado)"
            hint="Vista acotada al rango de la sede. El punto azul es tu ubicación si el navegador la permite."
          />
        }
        @if (mapaCongresoModo === 'editar') {
          <app-sede-mapa
            modo="libre"
            [centro]="centroSede"
            [seleccion]="borradorUbicacion"
            [editable]="true"
            [mostrarMiUbicacion]="true"
            [mostrarBusqueda]="true"
            ariaLabel="Editar ubicación del congreso"
            hint="Escribí una dirección o cruce y elegí del listado, o hacé clic / arrastrá el pin. Luego guardá."
            (posicionElegida)="onPosicionCongreso($event)"
          />
          <div class="inline-form-row" style="margin-top: 0.5rem">
            <button
              type="button"
              class="btn-primary"
              [disabled]="!borradorUbicacion || guardandoVentana === 'DATOS'"
              (click)="guardarUbicacionMapa()"
            >
              {{ guardandoVentana === 'DATOS' ? 'Guardando...' : 'Guardar ubicación' }}
            </button>
          </div>
        }
        @if (feedbackMapa) {
          <p [class]="feedbackMapaOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
            {{ feedbackMapa }}
          </p>
        }
      </section>

      <section class="panel-card" id="seccion-aulas">
        <h2>Aulas</h2>
        <p class="muted">
          Recursos físicos del evento. Al programar actividades se elige un aula; se controlan
          choques de horario en la misma aula. Opcionalmente ubicá cada aula dentro del rango del
          mapa de la sede.
        </p>

        <div class="form-grid form-grid-wide">
          <label>
            Nombre
            <input
              type="text"
              [(ngModel)]="aulaForm.nombre"
              [ngModelOptions]="{ standalone: true }"
              placeholder="Aula Magna"
            />
          </label>
          <label>
            Capacidad
            <input
              type="number"
              min="1"
              [(ngModel)]="aulaForm.capacidad"
              [ngModelOptions]="{ standalone: true }"
              placeholder="80"
            />
          </label>
          <label class="span-full">
            Ubicación (texto)
            <input
              type="text"
              [(ngModel)]="aulaForm.ubicacion"
              [ngModelOptions]="{ standalone: true }"
              placeholder="Edificio central"
            />
          </label>
        </div>

        <h3 style="margin-top: 1rem">Ubicación en el mapa</h3>
        @if (!centroSede) {
          <p class="muted small">
            Primero definí la ubicación del congreso en Datos (Editar ubicación).
          </p>
        } @else {
          <p class="muted small">
            @if (aulaSeleccionMapa) {
              Marcada: {{ aulaSeleccionMapa.lat | number: '1.5-5' }},
              {{ aulaSeleccionMapa.lng | number: '1.5-5' }}
            } @else {
              Sin punto en el mapa. Hacé clic dentro del rango de la sede.
            }
          </p>
          <app-sede-mapa
            modo="acotado"
            [centro]="centroSede"
            [aulas]="aulas"
            [excluirAulaId]="aulaEditId"
            [seleccion]="aulaSeleccionMapa"
            [editable]="true"
            [mostrarMiUbicacion]="true"
            ariaLabel="Mapa de aulas en el rango de la sede"
            hint="Mapa acotado al rango de la sede del congreso. Clic o arrastre para ubicar el aula."
            (posicionElegida)="onPosicionAula($event)"
          />
          <div class="inline-form-row" style="margin-top: 0.5rem">
            @if (aulaSeleccionMapa) {
              <button type="button" class="btn-link" (click)="quitarPosicionMapa()">
                Quitar del mapa
              </button>
            }
          </div>
        }

        <div class="inline-form-row" style="margin-top: 0.75rem">
          <button
            type="button"
            class="btn-primary"
            [disabled]="guardandoAula"
            (click)="guardarAula()"
          >
            {{ aulaEditId ? 'Actualizar aula' : 'Crear aula' }}
          </button>
          @if (aulaEditId) {
            <button type="button" class="btn-link" [disabled]="guardandoAula" (click)="cancelarEdicionAula()">
              Cancelar edición
            </button>
          }
        </div>
        @if (feedbackAula) {
          <p [class]="feedbackAulaOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
            {{ feedbackAula }}
          </p>
        }

        @if (aulas.length) {
          <table class="tabla-simple" style="margin-top: 1rem; width: 100%">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Capacidad</th>
                <th>Ubicación</th>
                <th>Mapa</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (a of aulas; track a.id) {
                <tr>
                  <td>{{ a.nombre }}</td>
                  <td>{{ a.capacidad ?? '—' }}</td>
                  <td>{{ a.ubicacion || '—' }}</td>
                  <td>
                    @if (linkMapa(a); as url) {
                      <a [href]="url" target="_blank" rel="noopener noreferrer">{{
                        etiquetaMapa(a)
                      }}</a>
                    } @else {
                      —
                    }
                  </td>
                  <td>{{ a.activa ? 'Activa' : 'Inactiva' }}</td>
                  <td class="inline-form-row">
                    <button type="button" class="btn-link" (click)="editarAula(a)">Editar</button>
                    @if (a.activa) {
                      <button type="button" class="btn-link" (click)="desactivarAula(a)">
                        Desactivar
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="muted" style="margin-top: 0.75rem">Todavía no hay aulas cargadas.</p>
        }
      </section>

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

        <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid rgba(0,0,0,0.08)">
        <h3>Finalizar congreso y emitir certificados</h3>
        <p class="muted">
          Al finalizar: habilita la descarga (hoy, si no había fecha o estaba en el futuro), crea un
          registro de certificado para cada inscripción <strong>aprobada</strong> y para
          evaluadores, y avisa por notificación/email. El PDF lo siguen generando las personas desde
          su pantalla imprimible (no se genera en el servidor).
        </p>
        <div class="inline-form-row">
          <button
            type="button"
            class="btn-primary"
            [disabled]="guardandoConfig || finalizandoCertificados"
            (click)="finalizarCongresoCertificados()"
          >
            {{
              finalizandoCertificados
                ? 'Procesando…'
                : 'Finalizar congreso / Habilitar certificados'
            }}
          </button>
        </div>
        @if (feedbackCertificados) {
          <p [class]="feedbackCertificadosOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
            {{ feedbackCertificados }}
          </p>
        }
        </div>
      </section>

      <section class="panel-card panel-card--indigo">
        <h2>Ventanas de tiempo del congreso</h2>
        <p class="muted">
          Cada bloque se guarda y notifica por separado. El congreso dura
          <strong>3 días corridos</strong> (día 1 = inicio, día 3 = fin automático).
        </p>

        <div class="panel-card" style="margin-top: 0.75rem; box-shadow: none">
          <h3>1. Inicio y fin del congreso</h3>
          <p class="muted small">Notifica a todos. Al guardar, el programa (día 1/2/3) se reacomoda a las nuevas fechas.</p>
          <div class="form-grid form-grid-wide">
            <label>
              Inicio del congreso (día 1)
              <input
                type="date"
                [(ngModel)]="ventanas.congresoDesde"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="onCongresoDesdeChange($event)"
              />
            </label>
            <label>
              Fin del congreso (día 3, automático)
              <input type="date" [ngModel]="ventanas.congresoHasta" [ngModelOptions]="{ standalone: true }" disabled />
            </label>
            <label class="span-full">
              Motivo del cambio
              <input
                type="text"
                [(ngModel)]="motivoCongreso"
                [ngModelOptions]="{ standalone: true }"
                placeholder="Ej. Postergación por causas climáticas"
              />
            </label>
          </div>
          <div class="inline-form-row" style="margin-top: 0.75rem">
            <button
              type="button"
              class="btn-primary"
              [disabled]="guardandoVentana === 'CONGRESO'"
              (click)="guardarBloqueCongreso()"
            >
              {{ guardandoVentana === 'CONGRESO' ? 'Guardando...' : 'Guardar fechas del congreso' }}
            </button>
          </div>
          @if (feedbackCongreso) {
            <p [class]="feedbackCongresoOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
              {{ feedbackCongreso }}
            </p>
          }
        </div>

        <div class="panel-card" style="margin-top: 0.75rem; box-shadow: none">
          <h3>2. Período de inscripción</h3>
          <p class="muted small">Notifica solo por este cambio (a todos).</p>
          <div class="form-grid form-grid-wide">
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
            <label class="span-full">
              Motivo del cambio
              <input
                type="text"
                [(ngModel)]="motivoInscripciones"
                [ngModelOptions]="{ standalone: true }"
                placeholder="Ej. Se amplía el plazo de inscripción"
              />
            </label>
          </div>
          <div class="inline-form-row" style="margin-top: 0.75rem">
            <button
              type="button"
              class="btn-primary"
              [disabled]="guardandoVentana === 'INSCRIPCIONES'"
              (click)="guardarBloqueInscripciones()"
            >
              {{
                guardandoVentana === 'INSCRIPCIONES'
                  ? 'Guardando...'
                  : 'Guardar período de inscripción'
              }}
            </button>
          </div>
          @if (feedbackInscripciones) {
            <p [class]="feedbackInscripcionesOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
              {{ feedbackInscripciones }}
            </p>
          }
        </div>

        <div class="panel-card" style="margin-top: 0.75rem; box-shadow: none">
          <h3>3. Plazo de envío de trabajos</h3>
          <p class="muted small">Notifica a asistentes y autores.</p>
          <div class="form-grid form-grid-wide">
            <label>
              Envío de trabajos hasta
              <input
                type="date"
                [(ngModel)]="ventanas.envioTrabajosHasta"
                [ngModelOptions]="{ standalone: true }"
              />
            </label>
            <label class="span-full">
              Motivo del cambio
              <input
                type="text"
                [(ngModel)]="motivoEnvio"
                [ngModelOptions]="{ standalone: true }"
                placeholder="Ej. Se extiende el plazo de envío"
              />
            </label>
          </div>
          <div class="inline-form-row" style="margin-top: 0.75rem">
            <button
              type="button"
              class="btn-primary"
              [disabled]="guardandoVentana === 'ENVIO'"
              (click)="guardarBloqueEnvio()"
            >
              {{ guardandoVentana === 'ENVIO' ? 'Guardando...' : 'Guardar plazo de envío' }}
            </button>
          </div>
          @if (feedbackEnvio) {
            <p [class]="feedbackEnvioOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
              {{ feedbackEnvio }}
            </p>
          }
        </div>

        <div class="panel-card" style="margin-top: 0.75rem; box-shadow: none">
          <h3>4. Plazo de evaluación</h3>
          <p class="muted small">Notifica solo a evaluadores.</p>
          <div class="form-grid form-grid-wide">
            <label>
              Evaluación hasta
              <input
                type="date"
                [(ngModel)]="ventanas.evaluacionHasta"
                [ngModelOptions]="{ standalone: true }"
              />
            </label>
            <label class="span-full">
              Motivo del cambio
              <input
                type="text"
                [(ngModel)]="motivoEvaluacion"
                [ngModelOptions]="{ standalone: true }"
                placeholder="Ej. Se extiende el plazo de evaluación"
              />
            </label>
          </div>
          <div class="inline-form-row" style="margin-top: 0.75rem">
            <button
              type="button"
              class="btn-primary"
              [disabled]="guardandoVentana === 'EVALUACION'"
              (click)="guardarBloqueEvaluacion()"
            >
              {{
                guardandoVentana === 'EVALUACION' ? 'Guardando...' : 'Guardar plazo de evaluación'
              }}
            </button>
          </div>
          @if (feedbackEvaluacion) {
            <p [class]="feedbackEvaluacionOk ? 'ok' : 'error'" style="margin-top: 0.5rem">
              {{ feedbackEvaluacion }}
            </p>
          }
        </div>

        <p class="muted small" style="margin-top: 0.75rem">
          El comité también puede editar solo la fecha límite de envío de trabajos desde su panel.
        </p>
      </section>

      <section class="panel-card" id="cronograma-congreso">
        <h2>Cronograma del congreso</h2>
        <p class="muted">Mesas temáticas, pósters, talleres y conferencias programadas.</p>
        <app-cronograma-congreso-admin />
      </section>
    </div>
  `,
})
export class CongresoAdminComponent implements OnInit {
  config?: CongresoConfig;
  certificadosInput = '';
  datos = { nombre: '', edicion: '', sede: '' };
  ventanas = {
    congresoDesde: '',
    congresoHasta: '',
    inscripcionesDesde: '',
    inscripcionesHasta: '',
    envioTrabajosHasta: '',
    evaluacionHasta: '',
  };
  motivoCongreso = '';
  motivoInscripciones = '';
  motivoEnvio = '';
  motivoEvaluacion = '';
  feedbackDatos = '';
  feedbackDatosOk = false;
  feedbackCongreso = '';
  feedbackCongresoOk = false;
  feedbackInscripciones = '';
  feedbackInscripcionesOk = false;
  feedbackEnvio = '';
  feedbackEnvioOk = false;
  feedbackEvaluacion = '';
  feedbackEvaluacionOk = false;
  feedbackAula = '';
  feedbackAulaOk = false;
  guardandoVentana: '' | 'DATOS' | 'CONGRESO' | 'INSCRIPCIONES' | 'ENVIO' | 'EVALUACION' = '';
  aulas: Aula[] = [];
  aulaEditId: number | null = null;
  aulaForm = {
    nombre: '',
    capacidad: null as number | null,
    ubicacion: '',
    latitud: null as number | null,
    longitud: null as number | null,
  };
  guardandoAula = false;
  error = '';
  mensaje = '';
  guardandoConfig = false;
  finalizandoCertificados = false;
  feedbackCertificados = '';
  feedbackCertificadosOk = false;
  /** null | ver (rango) | editar (libre) */
  mapaCongresoModo: null | 'ver' | 'editar' = null;
  borradorUbicacion: AulaMapaPunto | null = null;
  feedbackMapa = '';
  feedbackMapaOk = false;
  /** Referencia estable (no getter): si no, Leaflet se recrea en cada CD y se rompe. */
  centroSede: AulaMapaPunto | null = null;
  aulaSeleccionMapa: AulaMapaPunto | null = null;

  private congresoConfigService = inject(CongresoConfigService);
  private aulaService = inject(AulaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.congresoConfigService.obtener().subscribe({
      next: (c) => {
        this.config = c;
        this.certificadosInput = c.certificadosDisponiblesDesde ?? '';
        this.aplicarVentanasDesdeConfig(c);
        this.aplicarDatosDesdeConfig(c);
      },
      error: () => (this.config = undefined),
    });
    this.cargarAulas();
  }

  guardarDatos(): void {
    if (this.guardandoVentana) return;
    this.feedbackDatos = '';
    if (!this.datos.nombre.trim() || !this.datos.edicion.trim()) {
      this.feedbackDatos = 'Nombre y edición son obligatorios.';
      this.feedbackDatosOk = false;
      return;
    }
    this.guardandoVentana = 'DATOS';
    this.congresoConfigService
      .actualizar({
        grupo: 'DATOS',
        nombre: this.datos.nombre.trim(),
        edicion: this.datos.edicion.trim(),
        sede: this.datos.sede.trim(),
      })
      .subscribe({
        next: (c) => {
          this.config = c;
          this.aplicarDatosDesdeConfig(c);
          this.guardandoVentana = '';
          this.feedbackDatosOk = true;
          this.feedbackDatos = 'Datos del congreso guardados.';
        },
        error: (err) => {
          this.guardandoVentana = '';
          this.feedbackDatosOk = false;
          this.feedbackDatos = mensajeErrorApi(err, 'No se pudieron guardar los datos.');
        },
      });
  }

  abrirMapaCongreso(modo: 'ver' | 'editar'): void {
    this.feedbackMapa = '';
    if (modo === 'ver' && !this.centroSede) {
      this.feedbackMapaOk = false;
      this.feedbackMapa = 'Todavía no hay ubicación guardada. Usá «Editar ubicación».';
      return;
    }
    this.mapaCongresoModo = modo;
    this.borradorUbicacion = this.centroSede;
  }

  cerrarMapaCongreso(): void {
    this.mapaCongresoModo = null;
    this.borradorUbicacion = null;
  }

  onPosicionCongreso(p: AulaMapaPunto): void {
    this.borradorUbicacion = p;
  }

  guardarUbicacionMapa(): void {
    if (this.guardandoVentana || !this.borradorUbicacion) {
      return;
    }
    this.feedbackMapa = '';
    this.guardandoVentana = 'DATOS';
    this.congresoConfigService
      .actualizar({
        grupo: 'DATOS',
        mapaLatitud: this.borradorUbicacion.lat,
        mapaLongitud: this.borradorUbicacion.lng,
      })
      .subscribe({
        next: (c) => {
          this.config = c;
          this.aplicarDatosDesdeConfig(c);
          this.guardandoVentana = '';
          this.feedbackMapaOk = true;
          this.feedbackMapa = 'Ubicación del congreso guardada. El rango del mapa se actualizó.';
          this.mapaCongresoModo = 'ver';
          this.borradorUbicacion = this.centroSede;
        },
        error: (err) => {
          this.guardandoVentana = '';
          this.feedbackMapaOk = false;
          this.feedbackMapa = mensajeErrorApi(err, 'No se pudo guardar la ubicación.');
        },
      });
  }

  cargarAulas(): void {
    this.aulaService.listarAdmin().subscribe({
      next: (items) => {
        this.aulas = items;
        this.aplicarEditarAulaDesdeQuery();
      },
      error: () => (this.aulas = []),
    });
  }

  /** Deep-link desde cronograma: /admin/congreso?editarAula={id} */
  private aplicarEditarAulaDesdeQuery(): void {
    const raw = this.route.snapshot.queryParamMap.get('editarAula');
    if (!raw) {
      return;
    }
    const id = Number(raw);
    if (!Number.isFinite(id)) {
      return;
    }
    const aula = this.aulas.find((a) => a.id === id);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { editarAula: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    if (!aula) {
      this.feedbackAulaOk = false;
      this.feedbackAula = `No se encontró el aula #${id} para editar ubicación.`;
      return;
    }
    this.editarAula(aula);
    this.feedbackAulaOk = true;
    this.feedbackAula =
      aula.latitud != null && aula.longitud != null
        ? `Editando ubicación de «${aula.nombre}».`
        : `«${aula.nombre}» sin punto en el mapa — ubicála abajo y guardá.`;
    setTimeout(() => {
      document.getElementById('seccion-aulas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  editarAula(a: Aula): void {
    this.aulaEditId = a.id ?? null;
    this.aulaForm = {
      nombre: a.nombre,
      capacidad: a.capacidad ?? null,
      ubicacion: a.ubicacion ?? '',
      latitud: a.latitud ?? null,
      longitud: a.longitud ?? null,
    };
    this.syncAulaSeleccionMapa();
    this.feedbackAula = '';
  }

  cancelarEdicionAula(): void {
    this.aulaEditId = null;
    this.aulaForm = {
      nombre: '',
      capacidad: null,
      ubicacion: '',
      latitud: null,
      longitud: null,
    };
    this.syncAulaSeleccionMapa();
  }

  onPosicionAula(p: AulaMapaPunto): void {
    this.aulaForm.latitud = p.lat;
    this.aulaForm.longitud = p.lng;
    this.syncAulaSeleccionMapa();
  }

  quitarPosicionMapa(): void {
    this.aulaForm.latitud = null;
    this.aulaForm.longitud = null;
    this.syncAulaSeleccionMapa();
  }

  private syncAulaSeleccionMapa(): void {
    if (this.aulaForm.latitud == null || this.aulaForm.longitud == null) {
      this.aulaSeleccionMapa = null;
      return;
    }
    this.aulaSeleccionMapa = {
      lat: this.aulaForm.latitud,
      lng: this.aulaForm.longitud,
    };
  }

  linkMapa(a: Aula): string | null {
    return urlMapaAula(a);
  }

  etiquetaMapa(a: Aula): string {
    return etiquetaMapaAula(a);
  }

  guardarAula(): void {
    if (this.guardandoAula) return;
    this.feedbackAula = '';
    if (!this.aulaForm.nombre.trim()) {
      this.feedbackAula = 'Indicá el nombre del aula.';
      this.feedbackAulaOk = false;
      return;
    }
    this.guardandoAula = true;
    const body = {
      nombre: this.aulaForm.nombre.trim(),
      capacidad: this.aulaForm.capacidad || null,
      ubicacion: this.aulaForm.ubicacion.trim() || null,
      activa: true,
      latitud: this.aulaForm.latitud,
      longitud: this.aulaForm.longitud,
    };
    const req = this.aulaEditId
      ? this.aulaService.modificar(this.aulaEditId, body)
      : this.aulaService.crear(body);
    req.subscribe({
      next: () => {
        this.guardandoAula = false;
        this.feedbackAulaOk = true;
        this.feedbackAula = this.aulaEditId ? 'Aula actualizada.' : 'Aula creada.';
        this.cancelarEdicionAula();
        this.cargarAulas();
      },
      error: (err) => {
        this.guardandoAula = false;
        this.feedbackAulaOk = false;
        this.feedbackAula = mensajeErrorApi(err, 'No se pudo guardar el aula.');
      },
    });
  }

  desactivarAula(a: Aula): void {
    if (!a.id || this.guardandoAula) return;
    this.guardandoAula = true;
    this.aulaService.desactivar(a.id).subscribe({
      next: () => {
        this.guardandoAula = false;
        this.feedbackAulaOk = true;
        this.feedbackAula = `Aula "${a.nombre}" desactivada.`;
        this.cargarAulas();
      },
      error: (err) => {
        this.guardandoAula = false;
        this.feedbackAulaOk = false;
        this.feedbackAula = mensajeErrorApi(err, 'No se pudo desactivar el aula.');
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

  finalizarCongresoCertificados(): void {
    if (this.finalizandoCertificados || this.guardandoConfig) return;
    const ok = window.confirm(
      '¿Finalizar el congreso para certificados?\n\n' +
        'Se habilitará la descarga (hoy si corresponde), se registrarán certificados para ' +
        'inscritos aprobados y evaluadores, y se enviarán avisos por notificación/email.'
    );
    if (!ok) return;
    this.finalizandoCertificados = true;
    this.feedbackCertificados = '';
    this.error = '';
    this.congresoConfigService.finalizarCertificados().subscribe({
      next: (r) => {
        this.finalizandoCertificados = false;
        this.feedbackCertificadosOk = true;
        const desde = r.certificadosDisponiblesDesde
          ? this.formatFechaEs(
              typeof r.certificadosDisponiblesDesde === 'string'
                ? r.certificadosDisponiblesDesde.slice(0, 10)
                : String(r.certificadosDisponiblesDesde)
            )
          : 'hoy';
        this.feedbackCertificados =
          `Listo. Descarga desde ${desde}. ` +
          `Nuevos: ${r.certificadosCreados}, ya existían: ${r.certificadosYaExistentes}. ` +
          `Avisos enviados: ${r.notificacionesEnviadas}.`;
        this.mensaje = this.feedbackCertificados;
        this.congresoConfigService.obtener().subscribe({
          next: (c) => {
            this.config = c;
            this.certificadosInput = c.certificadosDisponiblesDesde ?? '';
          },
        });
      },
      error: (err) => {
        this.finalizandoCertificados = false;
        this.feedbackCertificadosOk = false;
        this.feedbackCertificados = mensajeErrorApi(err, 'No se pudo finalizar certificados.');
        this.error = this.feedbackCertificados;
      },
    });
  }

  onCongresoDesdeChange(desde: string): void {
    this.ventanas.congresoDesde = desde ?? '';
    this.ventanas.congresoHasta = desde ? finCongresoDesdeInicio(desde) : '';
  }

  guardarBloqueCongreso(): void {
    if (this.guardandoVentana) return;
    this.feedbackCongreso = '';
    if (!this.ventanas.congresoDesde.trim()) {
      this.feedbackCongreso = 'Indicá la fecha de inicio del congreso.';
      this.feedbackCongresoOk = false;
      return;
    }
    if (!this.motivoCongreso.trim()) {
      this.feedbackCongreso = 'Indicá el motivo del cambio.';
      this.feedbackCongresoOk = false;
      return;
    }
    const hasta = finCongresoDesdeInicio(this.ventanas.congresoDesde.trim());
    this.ventanas.congresoHasta = hasta;
    this.guardandoVentana = 'CONGRESO';
    this.congresoConfigService
      .actualizar({
        grupo: 'CONGRESO',
        congresoDesde: this.ventanas.congresoDesde.trim(),
        congresoHasta: hasta,
        motivo: this.motivoCongreso.trim(),
      })
      .subscribe({
        next: (c) => {
          this.config = c;
          this.aplicarVentanasDesdeConfig(c);
          this.guardandoVentana = '';
          this.feedbackCongresoOk = true;
          this.feedbackCongreso =
            'Fechas del congreso guardadas (3 días). El programa se reacomodó por día lógico.'
            + ' Se notificó a todos. Si había plazos posteriores al nuevo fin, se ajustaron.';
        },
        error: (err) => {
          this.guardandoVentana = '';
          this.feedbackCongresoOk = false;
          this.feedbackCongreso = mensajeErrorApi(
            err,
            'No se pudieron guardar las fechas del congreso.'
          );
        },
      });
  }

  guardarBloqueInscripciones(): void {
    if (this.guardandoVentana) return;
    this.feedbackInscripciones = '';
    if (!this.motivoInscripciones.trim()) {
      this.feedbackInscripciones = 'Indicá el motivo del cambio.';
      this.feedbackInscripcionesOk = false;
      return;
    }
    this.guardandoVentana = 'INSCRIPCIONES';
    this.congresoConfigService
      .actualizar({
        grupo: 'INSCRIPCIONES',
        inscripcionesDesde: this.ventanas.inscripcionesDesde.trim() || '',
        inscripcionesHasta: this.ventanas.inscripcionesHasta.trim() || '',
        motivo: this.motivoInscripciones.trim(),
      })
      .subscribe({
        next: (c) => {
          this.config = c;
          this.aplicarVentanasDesdeConfig(c);
          this.guardandoVentana = '';
          this.feedbackInscripcionesOk = true;
          this.feedbackInscripciones =
            'Período de inscripción guardado. Se notificó a todos.';
        },
        error: (err) => {
          this.guardandoVentana = '';
          this.feedbackInscripcionesOk = false;
          this.feedbackInscripciones = mensajeErrorApi(
            err,
            'No se pudo guardar el período de inscripción.'
          );
        },
      });
  }

  guardarBloqueEnvio(): void {
    if (this.guardandoVentana) return;
    this.feedbackEnvio = '';
    if (!this.motivoEnvio.trim()) {
      this.feedbackEnvio = 'Indicá el motivo del cambio.';
      this.feedbackEnvioOk = false;
      return;
    }
    this.guardandoVentana = 'ENVIO';
    this.congresoConfigService
      .actualizar({
        grupo: 'ENVIO',
        envioTrabajosHasta: this.ventanas.envioTrabajosHasta.trim() || '',
        motivo: this.motivoEnvio.trim(),
      })
      .subscribe({
        next: (c) => {
          this.config = c;
          this.aplicarVentanasDesdeConfig(c);
          this.guardandoVentana = '';
          this.feedbackEnvioOk = true;
          this.feedbackEnvio =
            'Plazo de envío guardado. Se notificó a asistentes y autores.';
        },
        error: (err) => {
          this.guardandoVentana = '';
          this.feedbackEnvioOk = false;
          this.feedbackEnvio = mensajeErrorApi(err, 'No se pudo guardar el plazo de envío.');
        },
      });
  }

  guardarBloqueEvaluacion(): void {
    if (this.guardandoVentana) return;
    this.feedbackEvaluacion = '';
    if (!this.motivoEvaluacion.trim()) {
      this.feedbackEvaluacion = 'Indicá el motivo del cambio.';
      this.feedbackEvaluacionOk = false;
      return;
    }
    this.guardandoVentana = 'EVALUACION';
    this.congresoConfigService
      .actualizar({
        grupo: 'EVALUACION',
        evaluacionHasta: this.ventanas.evaluacionHasta.trim() || '',
        motivo: this.motivoEvaluacion.trim(),
      })
      .subscribe({
        next: (c) => {
          this.config = c;
          this.aplicarVentanasDesdeConfig(c);
          this.guardandoVentana = '';
          this.feedbackEvaluacionOk = true;
          this.feedbackEvaluacion =
            'Plazo de evaluación guardado. Se notificó a evaluadores.';
        },
        error: (err) => {
          this.guardandoVentana = '';
          this.feedbackEvaluacionOk = false;
          this.feedbackEvaluacion = mensajeErrorApi(
            err,
            'No se pudo guardar el plazo de evaluación.'
          );
        },
      });
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

  private aplicarDatosDesdeConfig(c: CongresoConfig): void {
    this.datos = {
      nombre: c.nombre ?? '',
      edicion: c.edicion ?? '',
      sede: c.sede ?? '',
    };
    this.centroSede = centroDesdeConfig(c.mapaLatitud, c.mapaLongitud);
  }

  formatFechaEs(fecha: string): string {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }
}
