/**
 * Pantalla de inicio (ruta /).
 */
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { EstadoInscripcionParticipante } from '../../models/inscripcion.model';
import { etiquetaRol } from '../../models/role-labels';
import { InscripcionService } from '../../servicios/inscripcion.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero-congress">
      <div class="hero-inner">
        <h1>V Congreso Argentino de Agroecología</h1>
        <p class="hero-sub">La Plata, Argentina · 2027</p>
        <p class="hero-org">Organizado por LIRA - UNLP</p>

        @if (logueado) {
          <p class="hero-welcome">
            Hola, {{ usuario?.nombre }} {{ usuario?.apellido }}.
            @if (usuario?.rolActual) {
              Perfil activo: <strong>{{ etiqueta(usuario!.rolActual!) }}</strong>.
            } @else if (!tieneRolOperativo) {
              Todavía no tenés un rol operativo. Completá tu inscripción al congreso.
            }
          </p>

          @if (!esAsistente && estado?.puedeInscribirse) {
            <a routerLink="/inscripcion" class="btn-cta-inscripcion">
              Inscribirme al congreso
            </a>
          }
          @if (!esAsistente && estado?.inscripcion?.estado === 'PENDIENTE') {
            <p class="hero-status pending">
              Tu inscripción está pendiente de aprobación por la organización.
            </p>
            <a routerLink="/inscripcion" class="btn-hero-secondary">Ver estado de inscripción</a>
          }
          @if (esAsistente) {
            <p class="hero-status ok">
              Sos <strong>asistente</strong> al congreso. Accedé a tus acciones desde el panel.
            </p>
            <a routerLink="/asistente" class="btn-cta-inscripcion">Ir a mi panel de asistente</a>
          }
          @if (!esAsistente && estado?.inscripcion?.estado === 'RECHAZADA') {
            <p class="hero-status error">
              Tu inscripción fue rechazada.
              <a routerLink="/inscripcion">Enviar una nueva solicitud</a>
            </p>
          }

          @if (tieneRolOperativo) {
            <ul class="hero-links">
              <li><a [routerLink]="loginService.rutaPanel()">Ir a mi panel</a></li>
              @if (loginService.tieneVariosRoles()) {
                <li><a routerLink="/seleccion-rol">Cambiar perfil</a></li>
              }
            </ul>
          }
        } @else {
          <p class="hero-lead">
            Bienvenido al sistema del congreso. Registrate y completá tu inscripción para asistir
            al evento.
          </p>
          <div class="hero-actions">
            <a routerLink="/registro" class="btn-cta-inscripcion">Registrarme</a>
            <a routerLink="/login" class="btn-hero-secondary">Iniciar sesión</a>
          </div>
        }
      </div>
    </section>
  `,
})
export class InicioComponent implements OnInit {
  estado?: EstadoInscripcionParticipante;

  constructor(
    public loginService: LoginService,
    private inscripcionService: InscripcionService
  ) {}

  ngOnInit(): void {
    if (this.logueado && !this.esAsistente) {
      this.inscripcionService.misEstado().subscribe({
        next: (estado) => {
          this.estado = estado;
          if (estado.inscripcion?.estado === 'APROBADA') {
            this.loginService.refreshUser().subscribe({ error: () => undefined });
          }
        },
        error: () => undefined,
      });
    }
  }

  get logueado(): boolean {
    return this.loginService.isLogged();
  }

  get usuario() {
    return this.loginService.getUser();
  }

  get esAsistente(): boolean {
    return this.loginService.esAsistenteCongreso();
  }

  get tieneRolOperativo(): boolean {
    return this.loginService.tieneRolOperativo();
  }

  etiqueta(rol: string): string {
    return etiquetaRol(rol);
  }
}
