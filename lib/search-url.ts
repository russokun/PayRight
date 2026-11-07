import type { SearchFilters, SearchSort } from './api/client';

export type RouteParams = Record<string, string | string[] | undefined>;

export const SORT_OPTIONS: { key: SearchSort; label: string }[] = [
  { key: 'relevancia', label: 'Relevancia' },
  { key: 'barato', label: 'Más barato' },
  { key: 'ahorro', label: 'Mayor ahorro' },
];

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

/** Los parámetros de `/buscar` (`q`, `category`, `subcategory`, `chain`, `offers`, `sort`) como filtros de la API. */
export function parseSearchParams(params: RouteParams): SearchFilters {
  const q = (first(params.q) ?? '').trim().slice(0, 80);
  const sort = SORT_OPTIONS.find((s) => s.key === first(params.sort))?.key;
  const offers = ['1', 'true'].includes(first(params.offers) ?? '');
  return {
    q: q || undefined,
    category: first(params.category) || undefined,
    subcategory: first(params.subcategory) || undefined,
    chain: first(params.chain) || undefined,
    offers: offers || undefined,
    sort: sort && sort !== 'relevancia' ? sort : undefined,
  };
}

/** Lo inverso: parámetros de ruta sin los valores vacíos (para `router.push`/`setParams`). */
export function toRouteParams(filters: SearchFilters): Record<string, string> {
  const out: Record<string, string> = {};
  if (filters.q?.trim()) out.q = filters.q.trim();
  if (filters.category) out.category = filters.category;
  if (filters.subcategory) out.subcategory = filters.subcategory;
  if (filters.chain) out.chain = filters.chain;
  if (filters.offers) out.offers = '1';
  if (filters.sort && filters.sort !== 'relevancia') out.sort = filters.sort;
  return out;
}

/**
 * Para `router.setParams`: los seis parámetros siempre presentes, con `undefined` donde no hay valor
 * (`setParams` mezcla con lo anterior, así que un valor ausente tiene que quitarse explícitamente).
 */
export function toRouteParamsPatch(
  filters: SearchFilters,
): Record<
  'q' | 'category' | 'subcategory' | 'chain' | 'offers' | 'sort',
  string | undefined
> {
  const p = toRouteParams(filters);
  return {
    q: p.q,
    category: p.category,
    subcategory: p.subcategory,
    chain: p.chain,
    offers: p.offers,
    sort: p.sort,
  };
}

/** Filtros que acotan la búsqueda (el texto y el orden no cuentan). */
export function activeFilterCount(filters: SearchFilters): number {
  return [
    filters.category,
    filters.subcategory,
    filters.chain,
    filters.offers ? '1' : undefined,
  ].filter(Boolean).length;
}

/** `true` si no hay ningún criterio: ni texto ni filtros. */
export function isUnfiltered(filters: SearchFilters): boolean {
  return !filters.q?.trim() && activeFilterCount(filters) === 0;
}
