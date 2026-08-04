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
    <div class="inicio-page">
      <section class="hero-congress">
        <div class="hero-congress-depth" aria-hidden="true"></div>
        <div class="hero-inner">
          <span class="hero-kicker">Agroecología · Ciencia · Territorio</span>
          <h1>{{ tituloCongreso }}</h1>
          <p class="hero-sub">{{ sedeAnio }}</p>
          <p class="hero-org">Organizado por LIRA - UNLP</p>

          @if (logueado) {
            <div class="hero-session-card">
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
                <a routerLink="/inscripcion" class="btn-hero-secondary"
                  >Ver estado de inscripción</a
                >
              }
              @if (esAsistente) {
                <p class="hero-status ok">
                  Sos <strong>asistente</strong> al congreso. Accedé a tus acciones desde el panel.
                </p>
                <a routerLink="/asistente" class="btn-cta-inscripcion"
                  >Ir a mi panel de asistente</a
                >
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
            </div>
          } @else {
            <p class="hero-lead">
              Un espacio para compartir conocimientos, experiencias y soluciones que construyen
              sistemas agroalimentarios sustentables.
            </p>
            <div class="hero-actions">
              <a routerLink="/registro" class="btn-cta-inscripcion">Registrarme</a>
              <a routerLink="/login" class="btn-hero-secondary">Iniciar sesión</a>
            </div>
          }
        </div>
        <div class="hero-scroll-cue" aria-hidden="true">
          <span></span>
        </div>
      </section>

      <section class="inicio-contexto">
        <div class="inicio-contexto-encabezado">
          <span class="inicio-eyebrow">Un encuentro que transforma</span>
          <h2>Contexto del Congreso</h2>
          <p>
            Ciencia, producción y comunidad se encuentran para pensar el futuro de nuestros
            territorios.
          </p>
        </div>

        <div class="inicio-contexto-grid">
          <article class="inicio-contexto-card inicio-contexto-card--encuentro">
            <div class="inicio-contexto-card-foto" aria-hidden="true"></div>
            <div class="inicio-contexto-card-contenido">
              <span class="inicio-card-numero">01</span>
              <h3>Encuentro e intercambio</h3>
              <p>
                El V Congreso Argentino de Agroecología representa un espacio fundamental para el
                encuentro, debate e intercambio de experiencias en Argentina y Latinoamérica.
              </p>
            </div>
          </article>

          <article class="inicio-contexto-card inicio-contexto-card--comunidad">
            <div class="inicio-contexto-card-foto" aria-hidden="true"></div>
            <div class="inicio-contexto-card-contenido">
              <span class="inicio-card-numero">02</span>
              <h3>Una comunidad diversa</h3>
              <p>
                Productores, investigadores, estudiantes y organizaciones comparten el compromiso
                de construir sistemas sustentables, con soberanía alimentaria y cuidado ambiental.
              </p>
            </div>
          </article>

          <article class="inicio-contexto-card inicio-contexto-card--experiencias">
            <div class="inicio-contexto-card-foto" aria-hidden="true"></div>
            <div class="inicio-contexto-card-contenido">
              <span class="inicio-card-numero">03</span>
              <h3>Experiencias en movimiento</h3>
              <p>
                Presentaciones científicas, talleres, ferias agroecológicas y espacios de
                intercambio horizontal conectan las ideas con las prácticas del territorio.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section class="inicio-historia">
        <a
          routerLink="/historia"
          class="inicio-historia-banner"
          aria-label="Ir a Historia del Congreso"
        >
          <div class="inicio-historia-overlay">
            <span class="inicio-historia-badge">Historia del congreso</span>
            <h2>Evolución y memorias de las ediciones anteriores</h2>
            <p>
              Una línea de tiempo para recorrer los encuentros, aprendizajes y documentos que
              construyeron esta comunidad.
            </p>
            <span class="inicio-historia-cta">Recorrer nuestra historia <b>→</b></span>
          </div>
        </a>
      </section>
    </div>
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
