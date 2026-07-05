import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppVersionService {
  private readonly storageKey = 'jyaa-app-build';

  /** Si el deploy cambió, recarga automáticamente para tomar el bundle nuevo. */
  checkForUpdate(): void {
    fetch(`/version.json?_=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { build?: string } | null) => {
        if (!data?.build) return;
        const prev = localStorage.getItem(this.storageKey);
        if (prev && prev !== data.build) {
          localStorage.setItem(this.storageKey, data.build);
          window.location.reload();
          return;
        }
        if (!prev) {
          localStorage.setItem(this.storageKey, data.build);
        }
      })
      .catch(() => {});
  }
}
