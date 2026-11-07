import { useEffect } from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { shouldAdoptPlace } from './place';

/**
 * Guarda en la ubicación el nombre que calculó la API (`meta.location.place` de `/nearby` o `/stores`) cuando el GPS
 * aún no tenía uno. Las pantallas que consultan esos endpoints lo llaman con el `meta` que reciben.
 */
export function useAdoptPlace(
  fromApi: { lat: number; lng: number; place: string } | null | undefined,
): void {
  const current = useLocationStore((s) => s.location);
  const lat = fromApi?.lat;
  const lng = fromApi?.lng;
  const place = fromApi?.place;
  useEffect(() => {
    if (lat === undefined || lng === undefined || place === undefined) return;
    if (!shouldAdoptPlace(current, { lat, lng, place })) return;
    useLocationStore.getState().setLocation({ ...current!, place });
  }, [current, lat, lng, place]);
}
