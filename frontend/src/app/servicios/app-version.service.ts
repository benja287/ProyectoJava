import { Injectable, OnDestroy } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppVersionService implements OnDestroy {
  private readonly storageKey = 'jyaa-app-build';
  private readonly reloadAttemptKey = 'jyaa-app-reload-attempt';
  private readonly mainScriptPattern = /main-([A-Za-z0-9]+)\.js/;
  private pollTimer?: ReturnType<typeof setInterval>;
  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.checkForUpdate();
    }
  };

  /** Comprueba si hay un deploy nuevo y recarga antes de seguir con bundle viejo. */
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
      const bust = Date.now();
      const [versionData, indexHtml] = await Promise.all([
        fetch(`/version.json?_=${bust}`, { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch(`/index.html?_=${bust}`, { cache: 'no-store' })
          .then((r) => (r.ok ? r.text() : null))
          .catch(() => null),
      ]);

      const serverMainHash = this.mainHashFrom(indexHtml ?? '');
      const loadedMainHash = this.mainHashFrom(this.loadedMainScriptSrc());

      if (serverMainHash && loadedMainHash && serverMainHash !== loadedMainHash) {
        this.forceReload(serverMainHash);
        return;
      }

      const remoteBuild = versionData?.build as string | undefined;
      if (!remoteBuild) {
        return;
      }

      const prev = localStorage.getItem(this.storageKey);
      if (prev && prev !== remoteBuild) {
        this.forceReload(remoteBuild);
        return;
      }

      localStorage.setItem(this.storageKey, remoteBuild);
    } catch {
      // Sin bloquear la app si falla la red
    }
  }

  private loadedMainScriptSrc(): string {
    const script = document.querySelector('script[src*="main-"]');
    return script?.getAttribute('src') ?? '';
  }

  private mainHashFrom(value: string): string | null {
    const match = value.match(this.mainScriptPattern);
    return match?.[1] ?? null;
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
