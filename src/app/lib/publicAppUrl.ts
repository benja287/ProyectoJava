/**
 * Origen público para armar enlaces en correos o QR (evita localhost si definís prod).
 * En `.env`: `VITE_PUBLIC_APP_URL=https://tu-dominio.com` sin barra final.
 */
export function getPublicAppOrigin(): string {
  const v = import.meta.env.VITE_PUBLIC_APP_URL;
  if (typeof v === 'string' && v.trim()) return v.trim().replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return '';
}
