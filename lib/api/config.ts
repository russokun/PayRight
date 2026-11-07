/**
 * Base de la API v1 de PayRight. `EXPO_PUBLIC_API_URL` se inlinea en el build (debe leerse con este
 * nombre exacto). Sin ella, la API local de desarrollo.
 */
export const API_URL: string = (
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3111/api/v1'
).replace(/\/+$/, '');

/** Tiempo máximo de una consulta antes de darla por perdida. */
export const REQUEST_TIMEOUT_MS = 15_000;
