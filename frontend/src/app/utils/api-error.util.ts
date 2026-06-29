/** Extrae el mensaje de error del backend ({ error: "..." }) o de HttpErrorResponse. */
export function mensajeErrorApi(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const body = err as { error?: unknown; message?: string; status?: number };
    if (body.error && typeof body.error === 'object') {
      const nested = body.error as { error?: string; message?: string };
      if (typeof nested.error === 'string' && nested.error.trim()) {
        return nested.error;
      }
      if (typeof nested.message === 'string' && nested.message.trim()) {
        return nested.message;
      }
    }
    if (typeof body.error === 'string' && body.error.trim()) {
      return body.error;
    }
    if (body.status === 0) {
      return 'No se pudo conectar con la API. Verificá la red o el proxy/CORS.';
    }
  }
  return fallback;
}
