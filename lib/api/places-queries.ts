import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import {
  getCommunes,
  getGo,
  getNearby,
  getStores,
  type LatLng,
} from './places-client';

/** Cuánto se considera fresco cada dato antes de volver a pedirlo. Las comunas no cambian: un día. */
export const PLACES_STALE = {
  nearby: 2 * 60_000,
  stores: 10 * 60_000,
  communes: 24 * 60 * 60_000,
} as const;

/** Radios que ofrece «Cerca» (km). */
export const RADII_KM = [2, 5, 10] as const;
export const DEFAULT_RADIUS_KM = 5;
export const NEARBY_LIMIT = 24;
export const STORES_LIMIT = 8;

export const placesKeys = {
  nearby: (loc: LatLng | null, radiusKm: number) =>
    ['api', 'nearby', loc?.lat ?? null, loc?.lng ?? null, radiusKm] as const,
  stores: (loc: LatLng | null) =>
    ['api', 'stores', loc?.lat ?? null, loc?.lng ?? null] as const,
  communes: () => ['api', 'communes'] as const,
};

/** Mejores precios cerca de `loc` (de `useApiLocation()`). Sin ubicación no consulta. */
export function useNearby(
  loc: LatLng | null,
  radiusKm: number = DEFAULT_RADIUS_KM,
) {
  return useQuery({
    queryKey: placesKeys.nearby(loc, radiusKm),
    queryFn: ({ signal }) =>
      getNearby(
        { lat: loc!.lat, lng: loc!.lng, radiusKm, limit: NEARBY_LIMIT },
        { signal },
      ),
    enabled: loc !== null,
    staleTime: PLACES_STALE.nearby,
    // al cambiar el radio, la lista anterior se queda (atenuada) hasta que llega la nueva
    placeholderData: keepPreviousData,
  });
}

/** Supermercados cerca de `loc`. Sin ubicación no consulta. */
export function useStores(loc: LatLng | null) {
  return useQuery({
    queryKey: placesKeys.stores(loc),
    queryFn: ({ signal }) =>
      getStores(
        { lat: loc!.lat, lng: loc!.lng, limit: STORES_LIMIT },
        { signal },
      ),
    enabled: loc !== null,
    staleTime: PLACES_STALE.stores,
    placeholderData: keepPreviousData,
  });
}

/** Las 346 comunas con sus coordenadas, agrupadas por región. */
export function useCommunes(enabled = true) {
  return useQuery({
    queryKey: placesKeys.communes(),
    queryFn: ({ signal }) => getCommunes({ signal }),
    staleTime: PLACES_STALE.communes,
    gcTime: PLACES_STALE.communes,
    enabled,
  });
}

export type GoVariables = {
  slug: string;
  /** Cadena elegida; sin ella la API dice a cuál ir. */
  chain?: string;
  /** Para cancelar la espera (la API puede tardar hasta ~12 s releyendo la tienda). */
  signal?: AbortSignal;
};

/**
 * «Ir a la tienda»: una mutación, no una consulta, porque la dispara un toque y relee la tienda en vivo cada vez
 * (no tiene sentido cachearla ni repetirla sola).
 */
export function useGo() {
  return useMutation({
    mutationFn: ({ slug, chain, signal }: GoVariables) =>
      getGo(slug, chain, { signal }),
  });
}
