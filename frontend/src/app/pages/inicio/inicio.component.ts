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
              Perfil: <strong>{{ etiqueta(usuario!.rolActual!) }}</strong>.
            }
          </p>

          @if (esParticipante && estado?.puedeInscribirse) {
            <a routerLink="/participante/inscripcion" class="btn-cta-inscripcion">
              Inscribirme al congreso
            </a>
          }
          @if (esParticipante && estado?.inscripcion?.estado === 'PENDIENTE') {
            <p class="hero-status pending">Tu inscripción está pendiente de aprobación</p>
          }
          @if (esParticipante && estado?.inscripcion?.estado === 'APROBADA') {
            <p class="hero-status ok">Inscripción confirmada. ¡Nos vemos en el congreso!</p>
          }
          @if (esParticipante && estado?.inscripcion?.estado === 'RECHAZADA') {
            <p class="hero-status error">
              Tu inscripción fue rechazada.
              <a routerLink="/participante/inscripcion">Enviar una nueva solicitud</a>
            </p>
          }

          <ul class="hero-links">
            <li><a [routerLink]="loginService.rutaPanel()">Ir a mi panel</a></li>
            @if (loginService.tieneVariosRoles()) {
              <li><a routerLink="/seleccion-rol">Cambiar perfil</a></li>
            }
          </ul>
        } @else {
          <p class="hero-lead">
            Bienvenido al sistema del congreso. Registrate como participante o iniciá sesión.
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
    if (this.esParticipante) {
      this.inscripcionService.misEstado().subscribe({
        next: (estado) => (this.estado = estado),
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

  get esParticipante(): boolean {
    const u = this.usuario;
    if (!u) {
      return false;
    }
    return (
      u.rolActual === 'PARTICIPANTE' ||
      (!u.rolActual && (u.roles?.length === 1 && u.roles[0] === 'PARTICIPANTE'))
    );
  }

  etiqueta(rol: string): string {
    return etiquetaRol(rol);
  }
}
