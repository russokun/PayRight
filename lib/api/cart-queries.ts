import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { quoteSignature, toQuoteRequest, type CartLine } from '@/lib/cart/cart';
import { useCartStore } from '@/store/useCartStore';
import { useApiLocation } from '@/store/useLocationStore';
import { postQuote } from './cart-client';

/** Una cotización dura 1 min: los precios cambian en horas, y volver a la pestaña no debe repetir la consulta. */
export const QUOTE_STALE_MS = 60_000;

type Loc = { lat: number; lng: number } | null | undefined;

export const cartQueryKeys = {
  /** Depende de QUÉ se cotiza (productos y cantidades, sin importar el orden) y de la ubicación. */
  quote: (lines: readonly CartLine[], loc?: Loc) =>
    ['api', 'cart', 'quote', quoteSignature(lines), loc?.lat ?? null, loc?.lng ?? null] as const,
};

/**
 * Cotiza las líneas. Sin líneas no consulta. Mientras llega la cotización nueva (se cambió una cantidad) se sigue
 * mostrando la anterior (`isPlaceholderData`): la pantalla no parpadea.
 */
export function useQuote(lines: readonly CartLine[], location: Loc) {
  const body = useMemo(() => toQuoteRequest(lines, location), [lines, location]);
  return useQuery({
    queryKey: cartQueryKeys.quote(lines, location),
    queryFn: ({ signal }) => postQuote(body, { signal }),
    enabled: lines.length > 0,
    staleTime: QUOTE_STALE_MS,
    placeholderData: keepPreviousData,
  });
}

/**
 * La cotización del carrito del dispositivo con la ubicación elegida. Al llegar `unknown_slugs` (productos que ya no
 * existen en PayRight) los quita del carrito: la pantalla lo avisa con lo que queda en `useCartStore().pruned`.
 */
export function useCartQuote() {
  const lines = useCartStore((s) => s.lines);
  const location = useApiLocation();
  const prune = useCartStore((s) => s.prune);
  const query = useQuote(lines, location);

  // una cotización "de relleno" (la del carrito anterior) no decide nada: solo la del carrito actual
  const unknown = query.isPlaceholderData ? undefined : query.data?.unknown_slugs;
  useEffect(() => {
    if (unknown && unknown.length > 0) prune(unknown);
  }, [unknown, prune]);

  return { query, lines, location };
}
