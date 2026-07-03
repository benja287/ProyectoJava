import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { Trabajo } from '../../models/trabajo.model';
import { TrabajoService } from '../../servicios/trabajo.service';

@Component({
  selector: 'app-panel-asistente',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="panel-asistente">
      <h2 class="panel-asistente-titulo">Acciones disponibles</h2>

      <div class="panel-asistente-grid">
        @if (envioTrabajoDesdeAsistente) {
          <a routerLink="/asistente/trabajos" class="accion-card">
            <span class="accion-icono accion-icono--naranja" aria-hidden="true">📄</span>
            <div>
              <h3>Enviar Trabajo</h3>
              <p>Presenta tu trabajo científico o relato de experiencia (1 envío como asistente)</p>
            </div>
          </a>
        }

        @if (esAsistente && esTambienAutor) {
          <div class="accion-card accion-card--aviso">
            <span class="accion-icono accion-icono--naranja" aria-hidden="true">📄</span>
            <div>
              <h3>Envío de trabajos científicos</h3>
              <p>
                Tu cuenta tiene rol <strong>autor</strong>. Activá <strong>rol autor</strong> en el menú
                de usuario y entrá a <strong>Mis trabajos</strong> para enviar o gestionar trabajos.
              </p>
            </div>
          </div>
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

      @if (envioTrabajoDesdeAsistente) {
        <div class="mis-trabajos-card">
          <div class="mis-trabajos-header">
            <div>
              <h3>Mis trabajos (rol asistente)</h3>
              <p class="muted">Podés ver el estado y, si corresponde, reenviar correcciones.</p>
            </div>
            <a routerLink="/asistente/trabajos" class="btn-secundario">Ver detalle</a>
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
                  <span class="muted"> — {{ t.estado }}</span>
                </li>
              }
            </ul>
          }
        </div>
      }
    </section>
  `,
})
export class PanelAsistenteComponent implements OnInit {
  trabajos: Trabajo[] = [];
  cargandoTrabajos = true;

  constructor(
    private loginService: LoginService,
    private trabajoService: TrabajoService
  ) {}

  ngOnInit(): void {
    const userId = this.loginService.getUser()?.id;
    if (!userId) {
      this.cargandoTrabajos = false;
      return;
    }
    this.trabajoService.listar(1, 20, { autorId: userId }).subscribe({
      next: (items) => {
        this.trabajos = items;
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

  /** Solo asistente sin rol autor: envío desde este panel. */
  get envioTrabajoDesdeAsistente(): boolean {
    return this.esAsistente && !this.esTambienAutor;
  }
}
