import { isApiClientError } from './client';

/** Texto de un error para mostrar a la persona (los mensajes de la API ya vienen en español). */
export function errorMessage(e: unknown): string {
  if (isApiClientError(e)) {
    if (e.code === 'rate_limited' && e.retryAfterSeconds)
      return `${e.message} Espera ${e.retryAfterSeconds} s.`;
    return e.message;
  }
  return 'Algo salió mal. Intenta de nuevo.';
}

export function isNotFound(e: unknown): boolean {
  return isApiClientError(e) && e.code === 'not_found';
}
