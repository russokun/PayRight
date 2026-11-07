import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import type { ProductDTO } from '@/types/api';
import {
  getCategories,
  getListings,
  getMeta,
  getProduct,
  getTrend,
  searchProducts,
  type SearchFilters,
} from './client';

/** Cuánto se considera fresco cada dato antes de volver a pedirlo. */
export const STALE = {
  meta: 5 * 60_000,
  categories: 5 * 60_000,
  search: 60_000,
  product: 60_000,
  listings: 5 * 60_000,
  trend: 5 * 60_000,
} as const;

export const SEARCH_PAGE_SIZE = 20;

export const queryKeys = {
  all: ['api'] as const,
  meta: () => ['api', 'meta'] as const,
  search: (filters: SearchFilters) => ['api', 'search', filters] as const,
  product: (slug: string) => ['api', 'product', slug] as const,
  listings: (slug: string) => ['api', 'product', slug, 'listings'] as const,
  trend: (slug: string) => ['api', 'product', slug, 'trend'] as const,
  categories: (aisles: boolean) => ['api', 'categories', aisles] as const,
};

export function useMeta() {
  return useQuery({
    queryKey: queryKeys.meta(),
    queryFn: ({ signal }) => getMeta({ signal }),
    staleTime: STALE.meta,
  });
}

/** Quita los filtros vacíos para que `{q: "leche"}` y `{q: "leche", chain: undefined}` compartan caché. */
export function normalizeFilters(filters: SearchFilters): SearchFilters {
  const out: SearchFilters = {};
  const q = filters.q?.trim();
  if (q) out.q = q;
  if (filters.category) out.category = filters.category;
  if (filters.subcategory) out.subcategory = filters.subcategory;
  if (filters.chain) out.chain = filters.chain;
  if (filters.offers) out.offers = true;
  if (filters.sort && filters.sort !== 'relevancia') out.sort = filters.sort;
  return out;
}

/** Búsqueda paginada por `offset` (usa `meta.has_more`). Los resultados quedan en una sola lista, sin repetidos. */
export function useSearch(filters: SearchFilters, enabled = true) {
  const normalized = normalizeFilters(filters);
  return useInfiniteQuery({
    queryKey: queryKeys.search(normalized),
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      searchProducts(
        { ...normalized, limit: SEARCH_PAGE_SIZE, offset: pageParam },
        { signal },
      ),
    getNextPageParam: (last) =>
      last.page.has_more && last.items.length > 0
        ? last.page.offset + last.items.length
        : undefined,
    staleTime: STALE.search,
    // al escribir, la lista anterior se queda hasta que llega la nueva: sin parpadeo
    placeholderData: keepPreviousData,
    select: (data) => {
      const seen = new Set<string>();
      const items: ProductDTO[] = [];
      for (const page of data.pages) {
        for (const p of page.items) {
          if (seen.has(p.slug)) continue;
          seen.add(p.slug);
          items.push(p);
        }
      }
      return { items, total: data.pages[0]?.page.total ?? 0 };
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: queryKeys.product(slug),
    // la ubicación llega con el bloque 5: por ahora no se envía lat/lng
    queryFn: ({ signal }) => getProduct(slug, undefined, { signal }),
    staleTime: STALE.product,
    enabled: slug.length > 0,
  });
}

/** Lo que dice la página de cada cadena. Pesado: pedirlo solo al abrir "Detalle por cadena". */
export function useListings(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.listings(slug),
    queryFn: ({ signal }) => getListings(slug, { signal }),
    staleTime: STALE.listings,
    enabled: enabled && slug.length > 0,
  });
}

export function useTrend(slug: string) {
  return useQuery({
    queryKey: queryKeys.trend(slug),
    queryFn: ({ signal }) => getTrend(slug, { signal }),
    staleTime: STALE.trend,
    enabled: slug.length > 0,
  });
}

export function useCategories(aisles = false, enabled = true) {
  return useQuery({
    queryKey: queryKeys.categories(aisles),
    queryFn: ({ signal }) => getCategories(aisles, { signal }),
    staleTime: STALE.categories,
    enabled,
  });
}
