import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { DevolucionEvaluacionComponent } from '../../components/devolucion-evaluacion/devolucion-evaluacion.component';
import { MODALIDAD_LABELS } from '../../constants/ejes-tematicos';
import { PresentacionAutor, Trabajo, TrabajoEnvioResumen } from '../../models/trabajo.model';
import { etiquetaEstadoTrabajo } from '../../models/trabajo-estado-labels';
import { TrabajoService } from '../../servicios/trabajo.service';
import { feedbackTextoTrabajo } from '../../utils/trabajo-rol.util';
import { formatFechaActividad } from '../../utils/fecha.util';

@Component({
  selector: 'app-panel-autor',
  standalone: true,
  imports: [RouterLink, DevolucionEvaluacionComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--naranja">
        <span class="panel-hero-icon" aria-hidden="true">📄</span>
        <div>
          <h1>Mis Presentaciones</h1>
          <p>Gestioná tus trabajos, seguí el dictamen del comité y consultá dónde presentás</p>
        </div>
      </div>

      <section class="panel-asistente">
        <h2 class="panel-asistente-titulo">Acciones disponibles</h2>

        @if (mensajeTrabajo) {
          <p class="ok panel-asistente-aviso">{{ mensajeTrabajo }}</p>
        }

        <div class="panel-asistente-grid">
          @if (mostrarEnvioTrabajo || trabajos.length > 0) {
            <a routerLink="/autor/trabajos" class="accion-card">
              <span class="accion-icono accion-icono--naranja" aria-hidden="true">📄</span>
              <div>
                <h3>{{ trabajos.length > 0 ? 'Mis trabajos' : 'Enviar trabajo' }}</h3>
                <p>
                  {{
                    trabajos.length > 0
                      ? 'Gestioná tus trabajos enviados, el estado y las correcciones solicitadas.'
                      : 'Presentá tu trabajo científico o relato de experiencia como autor'
                  }}
                </p>
              </div>
            </a>
          }

          <a routerLink="/autor/cronograma" class="accion-card">
            <span class="accion-icono accion-icono--violeta" aria-hidden="true">📅</span>
            <div>
              <h3>Ver mi agenda</h3>
              <p>Agregá actividades del programa del congreso a tu cronograma personal</p>
            </div>
          </a>

          <a routerLink="/programa" class="accion-card">
            <span class="accion-icono accion-icono--teal" aria-hidden="true">🗓</span>
            <div>
              <h3>Programa del congreso</h3>
              <p>Consultá el cronograma publicado y elegí qué sumar a tu agenda</p>
            </div>
          </a>

          <a routerLink="/mis-certificados" class="accion-card">
            <span class="accion-icono accion-icono--azul" aria-hidden="true">📜</span>
            <div>
              <h3>Mis certificados</h3>
              <p>Imprimí o guardá los certificados disponibles para tu participación</p>
            </div>
          </a>

          <a routerLink="/solicitud-evaluador" class="accion-card">
            <span class="accion-icono accion-icono--indigo" aria-hidden="true">🧑‍🔬</span>
            <div>
              <h3>Solicitar ser evaluador/a</h3>
              <p>Postulate al comité de evaluadores con tu perfil y capacidad por eje</p>
            </div>
          </a>
        </div>

        <div class="mis-trabajos-card" id="mis-trabajos">
          <div class="mis-trabajos-header">
            <div>
              <h3>Mis trabajos en proceso</h3>
              @if (resumen) {
                <p class="muted">
                  Trabajos enviados (autor): {{ resumen.trabajosEnviadosRol }} | Total histórico:
                  {{ resumen.totalHistorico }}
                </p>
              }
            </div>
            <a routerLink="/autor/trabajos" class="btn-secundario">Gestionar trabajos</a>
          </div>

          @if (resumen) {
            <div
              class="limite-envio-box"
              [class.limite-envio-box--ok]="!resumen.fechaLimitePasada"
              [class.limite-envio-box--error]="resumen.fechaLimitePasada"
            >
              <strong>Límite de envíos</strong>
              <p>
                {{
                  resumen.envioTrabajosHasta
                    ? 'Fecha límite para enviar trabajos nuevos: ' + resumen.envioTrabajosHasta + ' (inclusive).'
                    : 'El Comité Académico aún no definió fecha límite de entrega: por ahora se permiten envíos nuevos.'
                }}
              </p>
              @if (resumen.fechaLimitePasada) {
                <p>No se permiten envíos nuevos: se superó la fecha límite.</p>
              }
            </div>

            @if (!resumen.puedeEnviarNuevo) {
              <div class="limite-envio-box limite-envio-box--warn">
                <p><strong>No podés enviar un nuevo trabajo en este momento.</strong></p>
                @if (resumen.mensajeBloqueo) {
                  <p>{{ resumen.mensajeBloqueo }}</p>
                }
                <p class="muted">
                  Trabajos activos (autor): {{ resumen.trabajosActivos }} | Reenvíos disponibles:
                  {{ resumen.reenviosDisponibles }}
                </p>
              </div>
            }
          }

          @if (cargandoTrabajos) {
            <p class="muted">Cargando trabajos...</p>
          } @else if (trabajos.length === 0) {
            <p class="mis-trabajos-vacio">Todavía no enviaste trabajos como autor.</p>
          } @else {
            @for (t of trabajos; track t.id) {
              <article class="trabajo-item-detalle">
                <div class="trabajo-item-detalle-header">
                  <strong>{{ t.titulo }}</strong>
                  <div>
                    <span class="estado-badge">Enviado como autor</span>
                    <span class="estado-badge estado-badge--enviado">{{ etiquetaEstado(t) }}</span>
                  </div>
                </div>
                <p class="trabajo-item-meta">
                  {{ t.ejeTematico || 'Sin eje' }} • {{ etiquetaModalidad(t.modalidad) }}
                  • Precheck {{ Math.min(t.precheckIntentos ?? 0, 3) }}/3 • Revisión
                  {{ Math.min(t.revisionIntentos ?? 0, 2) }}/2
                </p>
                <p class="trabajo-feedback" [class]="feedbackClass(t)">{{ feedbackTexto(t) }}</p>
                @if (t.id) {
                  <app-devolucion-evaluacion [trabajoId]="t.id" [estado]="t.estado" />
                }
                @if (puedeReenviar(t)) {
                  <a routerLink="/autor/trabajos" [queryParams]="{ resubmit: t.id }" class="link-correccion">
                    Editar y reenviar
                  </a>
                }
              </article>
            }
          }
        </div>

        <div class="mis-trabajos-card" id="mis-presentaciones">
          <div class="mis-trabajos-header">
            <div>
              <h3>Mis presentaciones programadas</h3>
              <p class="muted">Mesas temáticas (oral) y sesiones de pósters según la modalidad elegida al enviar</p>
            </div>
          </div>

          @if (cargandoPresentaciones) {
            <p class="muted">Cargando presentaciones...</p>
          } @else if (presentaciones.length === 0) {
            <p class="mis-trabajos-vacio">Aún no tenés presentaciones programadas en el cronograma.</p>
          } @else {
            @for (p of presentaciones; track p.trabajoId + '-' + p.actividadId) {
              <article
                class="presentacion-autor-card"
                [class.presentacion-autor-card--mesa]="p.tipoActividad === 'MESA_TEMATICA'"
                [class.presentacion-autor-card--poster]="p.tipoActividad === 'POSTER'"
              >
                <div class="presentacion-autor-badges">
                  @if (p.tipoActividad === 'MESA_TEMATICA') {
                    <span class="presentacion-tipo-badge presentacion-tipo-badge--mesa">Mesa temática</span>
                  } @else {
                    <span class="presentacion-tipo-badge presentacion-tipo-badge--poster">Sesión de pósters</span>
                  }
                  @if (p.actividadCodigo) {
                    <span class="muted small">{{ p.actividadCodigo }}</span>
                  }
                </div>
                <h4>{{ p.trabajoTitulo }}</h4>
                <p class="muted small">{{ p.actividadTitulo }}</p>
                <div class="presentacion-autor-meta">
                  <span>{{ formatFecha(p.inicio) }}</span>
                  @if (p.inicio && p.fin) {
                    <span>{{ horaRango(p.inicio, p.fin) }}</span>
                  }
                  @if (p.sala) {
                    <span>{{ p.sala }}</span>
                  }
                  @if (p.numeroPanel) {
                    <span class="presentacion-panel-badge">Panel {{ p.numeroPanel }}</span>
                  }
                </div>
                @if (p.ejeTematico) {
                  <p class="muted small">Eje: {{ p.ejeTematico }}</p>
                }
              </article>
            }
          }
        </div>
      </section>
    </div>
  `,
})
export class PanelAutorComponent implements OnInit {
  readonly Math = Math;
  readonly modalidadLabels = MODALIDAD_LABELS;
  readonly formatFecha = formatFechaActividad;

  trabajos: Trabajo[] = [];
  presentaciones: PresentacionAutor[] = [];
  resumen?: TrabajoEnvioResumen;
  cargandoTrabajos = true;
  cargandoPresentaciones = true;
  mensajeTrabajo = '';

  constructor(
    private loginService: LoginService,
    private trabajoService: TrabajoService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('trabajoEnviado') === '1') {
      this.mensajeTrabajo =
        'Tu trabajo fue enviado correctamente. El comité lo evaluará y podés seguir el estado acá.';
    }

    const userId = this.loginService.getUser()?.id;
    if (!userId) {
      this.cargandoTrabajos = false;
      this.cargandoPresentaciones = false;
      return;
    }

    this.trabajoService.resumenEnvio(userId, 'AUTOR').subscribe({
      next: (r) => (this.resumen = r),
      error: () => (this.resumen = undefined),
    });

    this.trabajoService.listar(1, 50, { autorId: userId }).subscribe({
      next: (items) => {
        this.trabajos = items.filter(
          (t) => t.tipo !== 'PROPUESTA_TALLER' && t.rolEnvio === 'AUTOR'
        );
        this.cargandoTrabajos = false;
      },
      error: () => {
        this.trabajos = [];
        this.cargandoTrabajos = false;
      },
    });

    this.trabajoService.listarPresentaciones(userId).subscribe({
      next: (items) => {
        this.presentaciones = items;
        this.cargandoPresentaciones = false;
      },
      error: () => {
        this.presentaciones = [];
        this.cargandoPresentaciones = false;
      },
    });
  }

  get mostrarEnvioTrabajo(): boolean {
    return this.trabajos.length === 0 && (this.resumen?.puedeEnviarNuevo ?? true);
  }

  etiquetaModalidad(modalidad?: string): string {
    if (modalidad === 'ORAL' || modalidad === 'POSTER') {
      return this.modalidadLabels[modalidad];
    }
    return modalidad || '—';
  }

  horaRango(inicio: string, fin: string): string {
    const hi = inicio.includes('T') ? inicio.split('T')[1]?.slice(0, 5) : inicio;
    const hf = fin.includes('T') ? fin.split('T')[1]?.slice(0, 5) : fin;
    return hi && hf ? `${hi} – ${hf}` : '';
  }

  etiquetaEstado(t: Trabajo): string {
    return etiquetaEstadoTrabajo(t.estado);
  }

  feedbackTexto(t: Trabajo): string {
    return feedbackTextoTrabajo(t, 'autor');
  }

  feedbackClass(t: Trabajo): string {
    if (t.estado === 'APROBADO' || t.estado === 'PROGRAMADO' || t.estado === 'NOTIFICADO') {
      return 'trabajo-feedback--ok';
    }
    if (t.estado === 'OBSERVADO_EVALUACION' || t.estado === 'PRECHECK_OBSERVADO') {
      return 'trabajo-feedback--warn';
    }
    if (t.estado === 'RECHAZADO') return 'trabajo-feedback--error';
    return 'trabajo-feedback--info';
  }

  puedeReenviar(t: Trabajo): boolean {
    if (
      t.estado === 'PRECHECK_OBSERVADO' &&
      (t.precheckIntentos ?? 0) > 0 &&
      (t.precheckIntentos ?? 0) < 3
    ) {
      return true;
    }
    return t.estado === 'OBSERVADO_EVALUACION' && (t.revisionIntentos ?? 0) < 2;
  }
}
