import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { Trabajo, TrabajoEnvioResumen } from '../../models/trabajo.model';
import { MODALIDAD_LABELS } from '../../constants/ejes-tematicos';
import { TrabajoService } from '../../servicios/trabajo.service';

@Component({
  selector: 'app-panel-asistente',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--naranja">
        <span class="panel-hero-icon" aria-hidden="true">👤</span>
        <div>
          <h1>Panel Asistente</h1>
          <p>Acciones disponibles para participantes del congreso</p>
        </div>
      </div>

      <section class="panel-asistente">
        <h2 class="panel-asistente-titulo">Acciones disponibles</h2>

        @if (mensajeTrabajo) {
          <p class="ok panel-asistente-aviso">{{ mensajeTrabajo }}</p>
        }

        <div class="panel-asistente-grid">
          @if (mostrarEnvioTrabajo || trabajos.length > 0) {
            <a routerLink="/asistente/trabajos" class="accion-card">
              <span class="accion-icono accion-icono--naranja" aria-hidden="true">📄</span>
              <div>
                <h3>{{ trabajos.length > 0 ? 'Mis trabajos' : 'Enviar Trabajo' }}</h3>
                <p>
                  {{
                    trabajos.length > 0
                      ? 'Gestioná tus trabajos enviados, el estado y las correcciones solicitadas.'
                      : 'Presentá tu trabajo científico o relato de experiencia (1 envío como asistente)'
                  }}
                </p>
              </div>
            </a>
          }

          <a routerLink="/asistente/taller" class="accion-card">
            <span class="accion-icono accion-icono--teal" aria-hidden="true">🖥</span>
            <div>
              <h3>Proponer Taller</h3>
              <p>Enviá tu propuesta de taller para evaluación del comité</p>
            </div>
          </a>

          <a routerLink="/asistente/cronograma" class="accion-card">
            <span class="accion-icono accion-icono--violeta" aria-hidden="true">📅</span>
            <div>
              <h3>Ver mi agenda</h3>
              <p>Consultá las actividades que agregaste al cronograma</p>
            </div>
          </a>

          <a routerLink="/asistente/certificado" class="accion-card">
            <span class="accion-icono accion-icono--azul" aria-hidden="true">✓</span>
            <div>
              <h3>Generar Certificado de Asistencia</h3>
              <p>Generá un certificado de asistencia al congreso para tu rol activo</p>
            </div>
          </a>
        </div>

        @if (esAsistente) {
          <div class="mis-trabajos-card" id="mis-trabajos">
            <div class="mis-trabajos-header">
              <div>
                <h3>Mis trabajos (rol asistente)</h3>
                @if (resumen) {
                  <p class="muted">
                    Trabajos enviados (asistente): {{ resumen.trabajosEnviadosRol }} | Total histórico:
                    {{ resumen.totalHistorico }}
                  </p>
                }
              </div>
              <a routerLink="/asistente/trabajos" class="btn-secundario">Gestionar trabajos</a>
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
                    Trabajos activos (asistente): {{ resumen.trabajosActivos }} | Reenvíos disponibles:
                    {{ resumen.reenviosDisponibles }}
                  </p>
                </div>
              }
            }

            @if (cargandoTrabajos) {
              <p class="muted">Cargando trabajos...</p>
            } @else if (trabajos.length === 0) {
              <p class="mis-trabajos-vacio">Todavía no enviaste trabajos como asistente.</p>
            } @else {
              @for (t of trabajos; track t.id) {
                <article class="trabajo-item-detalle">
                  <div class="trabajo-item-detalle-header">
                    <strong>{{ t.titulo }}</strong>
                    <div>
                      <span class="estado-badge">Enviado como asistente</span>
                      <span class="estado-badge estado-badge--enviado">{{ etiquetaEstado(t) }}</span>
                    </div>
                  </div>
                  <p class="trabajo-item-meta">
                    {{ t.ejeTematico || 'Sin eje' }} • Precheck
                    {{ Math.min(t.precheckIntentos ?? 0, 3) }}/3 • Revisión
                    {{ Math.min(t.revisionIntentos ?? 0, 2) }}/2
                  </p>
                  <p class="trabajo-feedback" [class]="feedbackClass(t)">{{ feedbackTexto(t) }}</p>
                  @if (puedeReenviar(t)) {
                    <a routerLink="/asistente/trabajos" [queryParams]="{ resubmit: t.id }" class="link-correccion">
                      Editar y reenviar
                    </a>
                  }
                </article>
              }
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class PanelAsistenteComponent implements OnInit {
  readonly Math = Math;
  readonly modalidadLabels = MODALIDAD_LABELS;

  trabajos: Trabajo[] = [];
  resumen?: TrabajoEnvioResumen;
  cargandoTrabajos = true;
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
      return;
    }

    this.trabajoService.resumenEnvio(userId, 'ASISTENTE').subscribe({
      next: (r) => (this.resumen = r),
      error: () => (this.resumen = undefined),
    });

    this.trabajoService.listar(1, 50, { autorId: userId }).subscribe({
      next: (items) => {
        this.trabajos = items.filter(
          (t) => t.tipo !== 'PROPUESTA_TALLER' && (t.rolEnvio === 'ASISTENTE' || !t.rolEnvio)
        );
        this.cargandoTrabajos = false;
      },
      error: () => {
        this.trabajos = [];
        this.cargandoTrabajos = false;
      },
    });
  }

  get esAsistente(): boolean {
    return this.loginService.esAsistenteCongreso();
  }

  get mostrarEnvioTrabajo(): boolean {
    return this.esAsistente && this.trabajos.length === 0 && (this.resumen?.puedeEnviarNuevo ?? true);
  }

  etiquetaEstado(t: Trabajo): string {
    const map: Record<string, string> = {
      ENVIADO: 'Enviado',
      PRECHECK_OK: 'Precheck OK',
      PRECHECK_OBSERVADO: 'Observado (precheck)',
      EN_EVALUACION: 'En evaluación',
      PENDIENTE_APROBACION_COMITE: 'Pendiente comité',
      APROBADO: 'Aprobado',
      OBSERVADO_EVALUACION: 'Rechazado (reenvío)',
      RECHAZADO: 'Rechazado',
    };
    return t.estado ? map[t.estado] ?? t.estado : '—';
  }

  feedbackTexto(t: Trabajo): string {
    if (t.estado === 'ENVIADO' && (t.precheckIntentos ?? 0) === 0) {
      return 'Trabajo enviado. Esperando prevalidación del Comité Académico.';
    }
    if (t.estado === 'PRECHECK_OBSERVADO') {
      return 'Trabajo observado en precheck. Podés corregirlo y reenviarlo.';
    }
    if (t.estado === 'OBSERVADO_EVALUACION') {
      return 'Rechazado por evaluadores. Podés corregirlo y reenviarlo.';
    }
    if (t.estado === 'PENDIENTE_APROBACION_COMITE') {
      return 'Evaluaciones favorables. Pendiente de confirmación final del comité.';
    }
    if (t.estado === 'EN_EVALUACION') {
      return 'En evaluación por los evaluadores asignados.';
    }
    if (t.estado === 'APROBADO') {
      return 'Trabajo aprobado por el comité académico.';
    }
    return '';
  }

  feedbackClass(t: Trabajo): string {
    if (t.estado === 'APROBADO') return 'trabajo-feedback--ok';
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
    return (
      t.estado === 'OBSERVADO_EVALUACION' && (t.revisionIntentos ?? 0) < 2
    );
  }
}
