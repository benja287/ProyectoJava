/**
 * Cierra la sesión tras 30 minutos sin actividad del usuario.
 * Los listeners corren fuera de NgZone; mousemove va limitado para no saturar el CPU.
 * El ciclo de vida del watcher lo gestiona AppComponent (start/stop).
 */
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from './login.service';

const IDLE_MS = 30 * 60 * 1000;
const MOUSEMOVE_THROTTLE_MS = 1000;

@Injectable({ providedIn: 'root' })
export class IdleSessionService {
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private watching = false;
  private lastMouseMove = 0;
  private readonly listeners: { type: string; handler: EventListener }[] = [];

  constructor(
    private loginService: LoginService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  /** Registra listeners globales una sola vez (llamar desde AppComponent.ngOnInit). */
  startWatching(): void {
    if (this.watching) {
      return;
    }
    this.watching = true;

    this.ngZone.runOutsideAngular(() => {
      const onActivity = () => this.handleActivity();
      const onMouseMove = () => {
        const now = Date.now();
        if (now - this.lastMouseMove < MOUSEMOVE_THROTTLE_MS) {
          return;
        }
        this.lastMouseMove = now;
        onActivity();
      };

      this.registerListener('click', onActivity);
      this.registerListener('keydown', onActivity);
      this.registerListener('mousemove', onMouseMove);
    });
  }

  /** Quita listeners y detiene el temporizador (llamar desde AppComponent.ngOnDestroy). */
  stopWatching(): void {
    for (const { type, handler } of this.listeners) {
      document.removeEventListener(type, handler, true);
    }
    this.listeners.length = 0;
    this.watching = false;
    this.clearIdleTimer();
  }

  /** Reinicia el contador solo si hay sesión activa (login o restauración vía LoginService). */
  resetIdleTimer(): void {
    this.clearIdleTimer();
    if (!this.hasActiveSession()) {
      return;
    }
    this.idleTimer = setTimeout(() => this.onIdleTimeout(), IDLE_MS);
  }

  clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private registerListener(type: string, handler: EventListener): void {
    document.addEventListener(type, handler, { passive: true, capture: true });
    this.listeners.push({ type, handler });
  }

  private handleActivity(): void {
    if (!this.hasActiveSession()) {
      this.clearIdleTimer();
      return;
    }
    this.resetIdleTimer();
  }

  private hasActiveSession(): boolean {
    const user = this.loginService.getUser();
    if (!user) {
      return false;
    }
    const token = this.loginService.getToken();
    if (!token) {
      return true;
    }
    return !this.loginService.isTokenExpired();
  }

  private onIdleTimeout(): void {
    if (!this.hasActiveSession()) {
      return;
    }
    this.loginService.logout();
    this.ngZone.run(() => {
      this.router.navigate(['/login'], { queryParams: { sessionExpired: '1' } });
    });
  }
}
