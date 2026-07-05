import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { Trabajo } from '../../models/trabajo.model';
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
        @if (mostrarEnvioTrabajo) {
          <a routerLink="/asistente/trabajos" class="accion-card">
            <span class="accion-icono accion-icono--naranja" aria-hidden="true">📄</span>
            <div>
              <h3>Enviar Trabajo</h3>
              <p>Presenta tu trabajo científico o relato de experiencia (1 envío como asistente)</p>
            </div>
          </a>
        }

        @if (esAsistente && esTambienAutor) {
          <a routerLink="/asistente/trabajos" class="accion-card">
            <span class="accion-icono accion-icono--naranja" aria-hidden="true">📄</span>
            <div>
              <h3>Mis trabajos</h3>
              <p>
                Gestioná tus trabajos enviados, el estado y las correcciones solicitadas por el
                comité.
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
              <p class="muted">Podés ver el estado y, si corresponde, reenviar correcciones.</p>
            </div>
            <a routerLink="/asistente/trabajos" class="btn-secundario">Gestionar trabajos</a>
          </div>

          @if (cargandoTrabajos) {
            <p class="muted">Cargando trabajos...</p>
          } @else if (trabajos.length === 0) {
            <p class="mis-trabajos-vacio">Todavía no enviaste trabajos como asistente.</p>
          } @else {
            <ul class="mis-trabajos-lista">
              @for (t of trabajos; track t.id) {
                <li>
                  <strong>{{ t.titulo }}</strong>
                  <span class="estado-badge">{{ t.estado }}</span>
                  @if (t.estado === 'APROBADO_CON_CORRECCIONES') {
                    <a routerLink="/asistente/trabajos" class="link-correccion">Reenviar correcciones</a>
                  }
                </li>
              }
            </ul>
          }
        </div>
      }
    </section>
    </div>
  `,
})
export class PanelAsistenteComponent implements OnInit {
  trabajos: Trabajo[] = [];
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
    this.trabajoService.listar(1, 20, { autorId: userId }).subscribe({
      next: (items) => {
        this.trabajos = items.filter((t) => t.tipo !== 'PROPUESTA_TALLER');
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

  get esTambienAutor(): boolean {
    return this.loginService.hasRole('AUTOR');
  }

  /** Tarjeta de primer envío: asistente sin rol autor previo. */
  get mostrarEnvioTrabajo(): boolean {
    return this.esAsistente && !this.esTambienAutor;
  }
}
