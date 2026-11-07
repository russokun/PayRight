import type { StoreDTO, StoresDTO } from '../../types/api';

/** Más allá de esto, «cerca» deja de ser cierto: se avisa que los supermercados están lejos (mismo máximo de radio de la API). */
export const FAR_KM = 25;

/**
 * Las dos listas de `/stores` sin repetir: el más cercano de cada cadena (sin importar cuán lejos) y, aparte, los más
 * cercanos de cualquier cadena que no estén ya arriba.
 */
export function splitStores(stores: StoresDTO): {
  perChain: StoreDTO[];
  others: StoreDTO[];
} {
  const taken = new Set(stores.per_chain.map((s) => s.id));
  return {
    perChain: stores.per_chain,
    others: stores.nearest.filter((s) => !taken.has(s.id)),
  };
}

/** Distancia al supermercado más cercano de todos, o `null` si no hay ninguno. */
export function nearestStoreKm(stores: StoresDTO): number | null {
  let best: number | null = null;
  for (const s of [...stores.per_chain, ...stores.nearest]) {
    if (
      Number.isFinite(s.distance_km) &&
      (best === null || s.distance_km < best)
    ) {
      best = s.distance_km;
    }
  }
  return best;
}

/** ¿El supermercado más cercano queda más allá de `FAR_KM`? Sin supermercados no hay nada que avisar. */
export function isFarAway(stores: StoresDTO): boolean {
  const d = nearestStoreKm(stores);
  return d !== null && d > FAR_KM;
}
