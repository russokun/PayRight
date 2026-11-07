import type { UserLocation } from '../../store/useLocationStore';

/** Dos puntos del mismo lugar para esta pantalla: ~500 m (el servidor puede redondear distinto que el teléfono). */
const SAME_PLACE_DEG = 0.005;

/** Cómo se nombra la ubicación en pantalla. Sin nombre aún (GPS), «tu ubicación». */
export function locationLabel(
  loc: Pick<UserLocation, 'place' | 'source'> | null,
): string {
  if (!loc) return 'Sin ubicación';
  if (loc.place) return loc.place;
  return loc.source === 'gps' ? 'Tu ubicación actual' : 'Tu comuna';
}

/** El rótulo de cómo se eligió: «GPS» o «Comuna». */
export function sourceLabelOf(loc: Pick<UserLocation, 'source'>): string {
  return loc.source === 'gps' ? 'Con tu GPS' : 'Elegida por comuna';
}

/**
 * ¿Guardar el nombre del lugar que trae `meta.location.place` de `/nearby` o `/stores`? Solo si la ubicación guardada
 * aún no tiene nombre (se obtuvo por GPS) y la respuesta es de ese mismo punto: una respuesta tardía de una
 * ubicación anterior no debe ponerle nombre a la nueva.
 */
export function shouldAdoptPlace(
  current: UserLocation | null,
  fromApi: { lat: number; lng: number; place: string } | null | undefined,
): boolean {
  if (!current || !fromApi) return false;
  if (current.place) return false;
  if (!fromApi.place || !fromApi.place.trim()) return false;
  return (
    Math.abs(current.lat - fromApi.lat) <= SAME_PLACE_DEG &&
    Math.abs(current.lng - fromApi.lng) <= SAME_PLACE_DEG
  );
}
