/**
 * Obtener la posición del teléfono con tiempo máximo y resultados tipados. La lógica vive aquí, sin importar
 * `expo-location` (se le pasan las funciones), para probarla; `gps.ts` la conecta con el módulo real.
 */

export type GpsResult =
  | { status: 'granted'; lat: number; lng: number }
  /** Dijo que no, pero se le puede volver a preguntar. */
  | { status: 'denied' }
  /** Bloqueado: el sistema ya no pregunta; solo se cambia en Ajustes. */
  | { status: 'blocked' }
  /** El GPS está apagado o el teléfono no pudo ubicarlo. */
  | { status: 'unavailable' }
  /** No llegó una posición a tiempo. */
  | { status: 'timeout' };

export type GpsPermission = { granted: boolean; canAskAgain: boolean };

export type GpsDeps = {
  getPermission: () => Promise<GpsPermission>;
  requestPermission: () => Promise<GpsPermission>;
  servicesEnabled: () => Promise<boolean>;
  getPosition: () => Promise<{ lat: number; lng: number }>;
};

/** Tope de espera de una posición. */
export const GPS_TIMEOUT_MS = 10_000;

const TIMED_OUT = Symbol('timeout');

/** Resuelve con la promesa, o con `TIMED_OUT` si pasan `ms` antes. */
async function raceTimeout<T>(
  p: Promise<T>,
  ms: number,
): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<typeof TIMED_OUT>((resolve) => {
        timer = setTimeout(() => resolve(TIMED_OUT), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Pide permiso en primer plano si hace falta y lee la posición. Nunca lanza: todo desenlace es un `GpsResult`.
 * Una posición con coordenadas que no existen se trata como «no disponible».
 */
export async function locate(
  deps: GpsDeps,
  timeoutMs: number = GPS_TIMEOUT_MS,
): Promise<GpsResult> {
  try {
    let permission = await deps.getPermission();
    if (!permission.granted && permission.canAskAgain) {
      permission = await deps.requestPermission();
    }
    if (!permission.granted) {
      return { status: permission.canAskAgain ? 'denied' : 'blocked' };
    }
    if (!(await deps.servicesEnabled())) return { status: 'unavailable' };

    const position = deps.getPosition();
    // si el tiempo se acaba primero, la lectura que sigue en curso no debe terminar en una promesa rechazada sin dueño
    position.catch(() => {});
    const result = await raceTimeout(position, timeoutMs);
    if (result === TIMED_OUT) return { status: 'timeout' };
    const { lat, lng } = result;
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    ) {
      return { status: 'unavailable' };
    }
    return { status: 'granted', lat, lng };
  } catch {
    return { status: 'unavailable' };
  }
}

export type GpsProblem = {
  /** Qué pasó, en una frase. */
  title: string;
  /** Qué hacer. */
  hint: string;
  /** Qué botón ofrecer: volver a intentar, abrir Ajustes o ninguno (solo elegir comuna). */
  action: 'retry' | 'settings';
};

/** El mensaje (en español) de cada desenlace que no es `granted`. */
export function gpsProblem(
  result: Exclude<GpsResult, { status: 'granted' }>,
): GpsProblem {
  switch (result.status) {
    case 'denied':
      return {
        title: 'No diste permiso para usar tu ubicación',
        hint: 'Puedes intentarlo de nuevo o elegir tu comuna abajo: funciona igual.',
        action: 'retry',
      };
    case 'blocked':
      return {
        title: 'La ubicación está desactivada para PayRight',
        hint: 'Actívala en Ajustes del teléfono, o elige tu comuna abajo.',
        action: 'settings',
      };
    case 'timeout':
      return {
        title: 'Tardamos demasiado en ubicarte',
        hint: 'Prueba de nuevo, mejor al aire libre, o elige tu comuna abajo.',
        action: 'retry',
      };
    case 'unavailable':
      return {
        title: 'No pudimos obtener tu ubicación',
        hint: 'Revisa que el GPS esté encendido, o elige tu comuna abajo.',
        action: 'retry',
      };
  }
}
