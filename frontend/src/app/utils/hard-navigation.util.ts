/** Navegación con recarga completa del documento (evita SPA sobre bundle cacheado). */
declare global {
  interface Window {
    __JYAA_BUILD__?: string;
  }
}

export function navegarConRecargaCompleta(path: string): void {
  const url = new URL(path, window.location.origin);
  const build = window.__JYAA_BUILD__;
  if (build && build !== '__JYAA_BUILD_ID__' && build !== 'dev') {
    url.searchParams.set('_cb', build);
  } else {
    url.searchParams.set('_t', String(Date.now()));
  }
  window.location.replace(url.href);
}
