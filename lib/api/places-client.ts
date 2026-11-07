import type {
  GoDTO,
  NearbyDTO,
  NearbyMeta,
  RegionDTO,
  StoresDTO,
  StoresMeta,
} from '@/types/api';
import { ApiClientError, request, type RequestOptions } from './client';

/**
 * Cliente de «Cerca de ti» e «Ir a la tienda»: encima de `request` (que no se edita). La ubicación viaja solo como
 * `lat`/`lng` redondeadas a ~110 m (3 decimales); nunca un identificador ni un punto exacto.
 */

export type LatLng = { lat: number; lng: number };

export type NearbyParams = LatLng & {
  /** La API usa 5 km si no se pide. */
  radiusKm?: number;
  /** La API usa 24 si no se pide. */
  limit?: number;
};

export type StoresParams = LatLng & { limit?: number };

export type NearbyPage = { items: NearbyDTO[]; meta: NearbyMeta };
export type StoresPage = { stores: StoresDTO; meta: StoresMeta };

/** `/go` relee en vivo las tiendas (hasta ~12 s en el servidor): la consulta espera más que las demás. */
export const GO_TIMEOUT_MS = 20_000;

const round3 = (n: number) => Math.round(n * 1000) / 1000;

function missingMeta(what: string): ApiClientError {
  return new ApiClientError(
    'internal_error',
    'PayRight tuvo un problema. Intenta de nuevo en un momento.',
    200,
    { details: `${what} no trae \`meta\`.` },
  );
}

/** Dónde ir a comprar un producto: la API relee la tienda ahora y dice a cuál ir. Con `chain`, solo mira esa. */
export async function getGo(
  slug: string,
  chain?: string,
  opts: RequestOptions = {},
): Promise<GoDTO> {
  return (
    await request<GoDTO>(
      `/products/${encodeURIComponent(slug)}/go`,
      { chain },
      { timeoutMs: GO_TIMEOUT_MS, ...opts },
    )
  ).data;
}

/** Los mejores precios alrededor de un punto. */
export async function getNearby(
  params: NearbyParams,
  opts: RequestOptions = {},
): Promise<NearbyPage> {
  const { data, meta } = await request<NearbyDTO[], NearbyMeta>(
    '/nearby',
    {
      lat: round3(params.lat),
      lng: round3(params.lng),
      radius_km: params.radiusKm,
      limit: params.limit,
    },
    opts,
  );
  if (!meta) throw missingMeta('/nearby');
  return { items: data, meta };
}

/** El supermercado más cercano de cada cadena y los más cercanos de cualquiera. */
export async function getStores(
  params: StoresParams,
  opts: RequestOptions = {},
): Promise<StoresPage> {
  const { data, meta } = await request<StoresDTO, StoresMeta>(
    '/stores',
    { lat: round3(params.lat), lng: round3(params.lng), limit: params.limit },
    opts,
  );
  if (!meta) throw missingMeta('/stores');
  return { stores: data, meta };
}

/** Regiones con sus comunas y coordenadas (346 comunas; estático). */
export async function getCommunes(
  opts: RequestOptions = {},
): Promise<RegionDTO[]> {
  return (await request<RegionDTO[]>('/communes', undefined, opts)).data;
}
