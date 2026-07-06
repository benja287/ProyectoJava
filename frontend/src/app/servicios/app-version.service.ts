import { Injectable, OnDestroy } from '@angular/core';
import { APP_BUILD_ID } from '../../environments/build-version';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    __JYAA_BUILD__?: string;
  }
}

@Injectable({ providedIn: 'root' })
export class AppVersionService implements OnDestroy {
  private readonly storageKey = 'jyaa-app-build';
  private readonly reloadAttemptKey = 'jyaa-app-reload-attempt';
  private pollTimer?: ReturnType<typeof setInterval>;
  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.checkForUpdate();
    }
  };

  /**
   * Bloquea el bootstrap de Angular si el bundle cargado no coincide con version.json.
   * Se ejecuta vía APP_INITIALIZER antes de montar componentes.
   */
  async ensureCurrentBuild(): Promise<void> {
    const staleTag = await this.detectStaleBuild();
    if (staleTag) {
      this.forceReload(staleTag);
      await new Promise<void>(() => {});
    }
  }

  /** Comprueba si hay un deploy nuevo y recarga si el bundle en memoria quedó viejo. */
  checkForUpdate(): void {
    if (!environment.production) {
      return;
    }
    void this.evaluateUpdate();
  }

  /** Revisa cada 3 min y al volver a la pestaña (deploy con sesión abierta). */
  startPolling(): void {
    if (!environment.production || this.pollTimer) {
      return;
    }
    this.pollTimer = setInterval(() => this.checkForUpdate(), 3 * 60 * 1000);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private async evaluateUpdate(): Promise<void> {
    try {
      const staleTag = await this.detectStaleBuild();
      if (staleTag) {
        this.forceReload(staleTag);
        return;
      }
      const remoteBuild = await this.fetchRemoteBuild();
      if (remoteBuild) {
        localStorage.setItem(this.storageKey, remoteBuild);
      }
    } catch {
      // Sin bloquear la app si falla la red
    }
  }

  private async detectStaleBuild(): Promise<string | null> {
    if (!environment.production) {
      return null;
    }
    const embedded = this.embeddedBuildId();
    if (!embedded || embedded === 'dev' || embedded === '__JYAA_BUILD_ID__') {
      return null;
    }
    const remoteBuild = await this.fetchRemoteBuild();
    if (!remoteBuild || remoteBuild === embedded) {
      return null;
    }
    return remoteBuild;
  }

  private embeddedBuildId(): string {
    const fromWindow = window.__JYAA_BUILD__;
    if (fromWindow && fromWindow !== '__JYAA_BUILD_ID__') {
      return fromWindow;
    }
    return APP_BUILD_ID;
  }

  private async fetchRemoteBuild(): Promise<string | null> {
    const bust = Date.now();
    const data = await fetch(`/version.json?_=${bust}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    return (data?.build as string | undefined) ?? null;
  }

  private forceReload(tag: string): void {
    if (sessionStorage.getItem(this.reloadAttemptKey) === tag) {
      return;
    }
    sessionStorage.setItem(this.reloadAttemptKey, tag);
    localStorage.setItem(this.storageKey, tag);

    const url = new URL(window.location.href);
    url.searchParams.set('_cb', tag);
    window.location.replace(url.toString());
  }
}
