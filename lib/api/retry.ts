import { isApiClientError } from "./client";

/** Sin reintentos en 4xx (la petición está mal o no existe); 2 en red, tiempo agotado y 5xx. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiClientError(error) && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

/** 1 s, 2 s, 4 s… con tope de 8 s. */
export function retryDelay(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 8000);
}
