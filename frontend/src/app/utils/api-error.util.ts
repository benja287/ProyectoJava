/** Indica si el backend rechazó la petición por cuenta inhabilitada (activo = false). */
export function isCuentaDeshabilitada(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }
  const payload = (err as { error?: unknown }).error;
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as { accountDisabled?: boolean }).accountDisabled === true
  );
}

/** Extrae el mensaje de error del backend ({ error: "..." }) o de HttpErrorResponse. */
export function mensajeErrorApi(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const http = err as { error?: unknown; message?: string; status?: number };
    const payload = http.error;
    if (payload && typeof payload === 'object') {
      const msg = (payload as { error?: string; message?: string }).error;
      if (typeof msg === 'string' && msg.trim()) {
        return msg;
      }
      const nestedMsg = (payload as { message?: string }).message;
      if (typeof nestedMsg === 'string' && nestedMsg.trim()) {
        return nestedMsg;
      }
    }
    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }
    if (http.status === 0) {
      return 'No se pudo conectar con la API. Verificá la red o el proxy/CORS.';
    }
  }
  return fallback;
}
