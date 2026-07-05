/**
 * Componente raíz de la aplicación.
 * selector 'app-root' → se monta en <app-root> del index.html.
 * Muestra header/footer fijos y delega el contenido central al Router (<router-outlet>).
 */
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { IdleSessionService } from './auth/idle-session.service';
import { LoginService } from './auth/login.service';
import { NotificacionService } from './servicios/notificacion.service';
import { CongresoConfigService } from './servicios/congreso-config.service';
import { AppVersionService } from './servicios/app-version.service';
import { CongresoConfig } from './models/congreso-config.model';
import { mensajeErrorApi } from './utils/api-error.util';
import { etiquetaRol } from './models/role-labels';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  /** Título mostrado en el brand del header (data binding {{ title }}) */
  title = 'V Congreso Argentino de Agroecología';
  /** Si el menú desplegable del usuario está abierto */
  menuAbierto = false;
  /** Bloquea botones mientras se cambia de rol vía API */
  cambiandoRol = false;
  /** Mensaje de error al fallar cambiarRolActual */
  errorRol = '';
  noLeidas = 0;
  congresoConfig?: CongresoConfig;

  /** Referencia al div del menú de usuario (#userMenu en el HTML) */
  @ViewChild('userMenu') userMenu?: ElementRef<HTMLElement>;

  /**
   * Inyección de dependencias (DI):
   * - LoginService: sesión del usuario (lee sessionStorage al crearse)
   * - Router: navegación programática (logout, cambio de perfil)
   * public loginService → el template puede usar loginService.tieneVariosRoles(), etc.
   */
  constructor(
    public loginService: LoginService,
    private idleSession: IdleSessionService,
    private notificacionService: NotificacionService,
    private congresoConfigService: CongresoConfigService,
    private appVersionService: AppVersionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.appVersionService.checkForUpdate();
    this.appVersionService.startPolling();
    this.idleSession.startWatching();
    this.refrescarNotificaciones();
    this.cargarConfigCongreso();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.refrescarNotificaciones();
        this.appVersionService.checkForUpdate();
      });
  }

  private cargarConfigCongreso(): void {
    this.congresoConfigService.obtener().subscribe({
      next: (c) => (this.congresoConfig = c),
      error: () => (this.congresoConfig = undefined),
    });
  }

  get avisoCertificado(): string | null {
    if (!this.loginService.esAsistenteCongreso()) return null;
    const desde = this.congresoConfig?.certificadosDisponiblesDesde;
    if (!desde) return null;
    const hoy = new Date();
    const [y, m, d] = desde.split('-').map(Number);
    const limite = new Date(y, m - 1, d, 23, 59, 59);
    if (hoy >= limite) return null;
    return `El certificado de asistencia estará disponible a partir del ${d}/${m}/${y}.`;
  }

  private refrescarNotificaciones(): void {
    if (!this.loginService.isLogged()) {
      this.noLeidas = 0;
      return;
    }
    this.notificacionService.contarNoLeidas().subscribe({
      next: (r) => (this.noLeidas = r.total),
      error: () => (this.noLeidas = 0),
    });
  }

  ngOnDestroy(): void {
    this.idleSession.stopWatching();
    this.appVersionService.ngOnDestroy();
  }

  /** Getter: el template usa "usuario" sin llamar al servicio directamente */
  get usuario() {
    return this.loginService.getUser();
  }

  /** Convierte código de rol (ADMINISTRADOR) a etiqueta legible */
  etiquetaRol(rol: string | null | undefined): string {
    return rol ? etiquetaRol(rol) : '—';
  }

  /** Abre/cierra el menú desplegable del header */
  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  /** Cierra el menú si el usuario hace clic fuera del panel */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuAbierto) {
      return;
    }
    const el = this.userMenu?.nativeElement;
    if (el && !el.contains(event.target as Node)) {
      this.menuAbierto = false;
    }
  }

  /**
   * Cambia rolActual vía PUT /api/usuarios/{id}/roles
   * y navega al home del perfil elegido (/admin, /participante, etc.)
   */
  elegirRol(rol: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.cambiandoRol || rol === this.usuario?.rolActual) {
      this.cerrarMenu();
      if (rol === this.usuario?.rolActual) {
        this.router.navigateByUrl(this.loginService.homeRoute());
      }
      return;
    }
    this.cambiandoRol = true;
    this.errorRol = '';
    this.loginService.cambiarRolActual(rol).subscribe({
      next: () => {
        this.cambiandoRol = false;
        this.cerrarMenu();
        this.router.navigateByUrl(this.loginService.homeRoute());
      },
      error: (err) => {
        this.cambiandoRol = false;
        this.errorRol = mensajeErrorApi(err, 'No se pudo cambiar el perfil.');
      },
    });
  }

  /** Borra sesión (memoria + sessionStorage) y va al login */
  logout(): void {
    this.cerrarMenu();
    this.loginService.logout();
    this.router.navigate(['/login']);
  }

  /** Ruta del link del brand: panel si hay sesión, inicio si no */
  irHome(): string {
    return this.loginService.isLogged()
      ? this.loginService.rutaPanel()
      : '/';
  }
}
