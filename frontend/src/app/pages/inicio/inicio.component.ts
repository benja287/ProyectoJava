/**
 * Pantalla de inicio (ruta /).
 */
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoginService } from '../../auth/login.service';
import { EstadoInscripcionParticipante } from '../../models/inscripcion.model';
import { CongresoConfig, anioCongreso } from '../../models/congreso-config.model';
import { etiquetaRol } from '../../models/role-labels';
import { CongresoConfigService } from '../../servicios/congreso-config.service';
import { InscripcionService } from '../../servicios/inscripcion.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero-congress">
      <div class="hero-inner">
        <h1>{{ tituloCongreso }}</h1>
        <p class="hero-sub">{{ sedeAnio }}</p>
        <p class="hero-org">Organizado por LIRA - UNLP</p>

        @if (logueado) {
          <p class="hero-welcome">
            Hola, {{ usuario?.nombre }} {{ usuario?.apellido }}.
            @if (usuario?.rolActual) {
              Perfil activo: <strong>{{ etiqueta(usuario!.rolActual!) }}</strong>.
            } @else if (necesitaInscripcion) {
              Sos usuario registrado. Completá tu inscripción al congreso para acceder como
              <strong>asistente</strong>.
            }
          </p>

          @if (necesitaInscripcion && estado?.puedeInscribirse) {
            <a routerLink="/inscripcion" class="btn-cta-inscripcion">
              Inscribirme al congreso
            </a>
          }
          @if (necesitaInscripcion && estado?.inscripcion?.estado === 'PENDIENTE') {
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
          @if (necesitaInscripcion && estado?.inscripcion?.estado === 'RECHAZADA') {
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

    <section class="inicio-contexto">
      <h2>Contexto del Congreso</h2>
      <div class="inicio-contexto-texto">
        <p>
          El V Congreso Argentino de Agroecología representa un espacio fundamental para el
          encuentro, debate e intercambio de experiencias en torno a la agroecología en Argentina y
          Latinoamérica.
        </p>
        <p>
          Este evento reúne a productores, investigadores, estudiantes, organizaciones y todos
          aquellos comprometidos con la construcción de sistemas agroalimentarios sustentables que
          promuevan la soberanía alimentaria y el cuidado del ambiente.
        </p>
        <p>
          Los congresos de agroecología se caracterizan por su enfoque participativo, donde se
          combinan presentaciones científicas, talleres temáticos, ferias agroecológicas y espacios
          de intercambio horizontal entre todos los participantes.
        </p>
      </div>
    </section>

    <section class="inicio-historia">
      <a routerLink="/historia" class="inicio-historia-banner" aria-label="Ir a Historia del Congreso">
        <div class="inicio-historia-overlay">
          <span class="inicio-historia-badge">Historia del congreso</span>
          <h2>Evolución y memorias de las ediciones anteriores</h2>
          <p>
            Línea de tiempo con información breve, enlaces a los sitios oficiales y (cuando
            corresponde) a las memorias/actas.
          </p>
          <span class="inicio-historia-cta">Ver historia →</span>
        </div>
      </a>
    </section>
  `,
})
export class InicioComponent implements OnInit {
  estado?: EstadoInscripcionParticipante;
  config?: CongresoConfig;

  constructor(
    public loginService: LoginService,
    private inscripcionService: InscripcionService,
    private congresoConfigService: CongresoConfigService
  ) {}

  ngOnInit(): void {
    this.congresoConfigService.obtener().subscribe({
      next: (c) => (this.config = c),
      error: () => (this.config = undefined),
    });
    if (!this.logueado) {
      return;
    }
    this.inscripcionService.misEstado().subscribe({
      next: (estado) => {
        this.estado = estado;
        this.loginService.sincronizarTrasEstadoCongreso(estado).subscribe();
      },
      error: () => undefined,
    });
  }

  get tituloCongreso(): string {
    const ed = this.config?.edicion?.trim() || 'V';
    const nom = this.config?.nombre?.trim() || 'Congreso Argentino de Agroecología';
    return `${ed} ${nom}`;
  }

  get sedeAnio(): string {
    const sede = this.config?.sede?.trim() || 'La Plata';
    return `${sede}, Argentina · ${anioCongreso(this.config)}`;
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

  get necesitaInscripcion(): boolean {
    return this.loginService.necesitaInscripcionCongreso();
  }

  get tieneRolOperativo(): boolean {
    return this.loginService.tieneRolOperativo();
  }

  etiqueta(rol: string): string {
    return etiquetaRol(rol);
  }
}
