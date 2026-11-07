import type {
  DepartmentDTO,
  ListingDTO,
  MetaDTO,
  PageMeta,
  ProductDTO,
  ProductDetailDTO,
  TrendDTO,
} from "@/types/api";
import { API_URL, REQUEST_TIMEOUT_MS } from "./config";

/** Códigos de la API (`error.code`) más los dos que nacen en el dispositivo. */
export type ApiErrorCode = "invalid_request" | "not_found" | "rate_limited" | "internal_error" | "network" | "timeout";

const API_CODES: readonly string[] = ["invalid_request", "not_found", "rate_limited", "internal_error"];

export class ApiClientError extends Error {
  readonly code: ApiErrorCode;
  /** Estado HTTP; 0 cuando no hubo respuesta (`network`, `timeout`). */
  readonly status: number;
  /** `error.details` de la API (p. ej. los parámetros inválidos). */
  readonly details?: unknown;
  /** Segundos que pide esperar un 429 (`Retry-After`). */
  readonly retryAfterSeconds?: number;

  constructor(
    code: ApiErrorCode,
    message: string,
    status: number,
    extra: { details?: unknown; retryAfterSeconds?: number } = {},
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = extra.details;
    this.retryAfterSeconds = extra.retryAfterSeconds;
  }
}

export function isApiClientError(e: unknown): e is ApiClientError {
  return e instanceof ApiClientError;
}

export type RequestOptions = {
  /** La señal que entrega TanStack Query: al cancelarse la consulta se corta el fetch. */
  signal?: AbortSignal;
  /** Por defecto `REQUEST_TIMEOUT_MS`. */
  timeoutMs?: number;
};

export type SearchSort = "relevancia" | "barato" | "ahorro";

export type SearchFilters = {
  q?: string;
  category?: string;
  subcategory?: string;
  chain?: string;
  offers?: boolean;
  sort?: SearchSort;
};

export type SearchParams = SearchFilters & { limit?: number; offset?: number };

export type SearchPage = { items: ProductDTO[]; page: PageMeta };

/** Ubicación opcional para medir distancias: solo si la persona la dio (bloque 5). */
export type LocationParam = { lat: number; lng: number } | { comuna: string };

type Envelope<T> = { data: T; meta?: PageMeta };

const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  invalid_request: "Revisa los datos de la consulta.",
  not_found: "No encontramos lo que buscabas.",
  rate_limited: "Hiciste muchas consultas seguidas. Espera un momento e intenta de nuevo.",
  internal_error: "PayRight tuvo un problema. Intenta de nuevo en un momento.",
  network: "No pudimos conectar con PayRight. Revisa tu conexión.",
  timeout: "La consulta tardó demasiado. Intenta de nuevo.",
};

function codeFromStatus(status: number): ApiErrorCode {
  if (status === 400) return "invalid_request";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  return "internal_error";
}

/** `Retry-After` llega en segundos o como fecha HTTP. */
function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, Math.ceil((at - now) / 1000));
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === "") continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return `${API_URL}${path}${parts.length ? `?${parts.join("&")}` : ""}`;
}

function abortError(): Error {
  const e = new Error("La consulta se canceló.");
  e.name = "AbortError";
  return e;
}

async function request<T>(
  path: string,
  query: Record<string, string | number | boolean | undefined> | undefined,
  opts: RequestOptions,
): Promise<Envelope<T>> {
  // ya cancelada: ni siquiera se pide
  if (opts.signal?.aborted) throw (opts.signal.reason instanceof Error ? opts.signal.reason : abortError());
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, opts.timeoutMs ?? REQUEST_TIMEOUT_MS);
  const outer = opts.signal;
  const forward = () => controller.abort();
  outer?.addEventListener("abort", forward, { once: true });

  try {
    let res: Response;
    try {
      res = await fetch(buildUrl(path, query), { headers: { Accept: "application/json" }, signal: controller.signal });
    } catch (e) {
      // la cancelación del llamador no es un error de la API: TanStack Query la entiende tal cual
      if (outer?.aborted) throw (outer.reason instanceof Error ? outer.reason : abortError());
      if (timedOut) throw new ApiClientError("timeout", DEFAULT_MESSAGES.timeout, 0);
      throw new ApiClientError("network", DEFAULT_MESSAGES.network, 0, { details: e instanceof Error ? e.message : undefined });
    }

    let body: unknown;
    try {
      body = JSON.parse(await res.text());
    } catch {
      if (outer?.aborted) throw (outer.reason instanceof Error ? outer.reason : abortError());
      if (timedOut) throw new ApiClientError("timeout", DEFAULT_MESSAGES.timeout, 0);
      body = undefined; // p. ej. una página HTML de error: se trata por el estado HTTP
    }

    if (!res.ok) {
      const err = (body as { error?: { code?: unknown; message?: unknown; details?: unknown } } | undefined)?.error;
      const code: ApiErrorCode = typeof err?.code === "string" && API_CODES.includes(err.code)
        ? (err.code as ApiErrorCode)
        : codeFromStatus(res.status);
      const message = typeof err?.message === "string" && err.message ? err.message : DEFAULT_MESSAGES[code];
      throw new ApiClientError(code, message, res.status, {
        details: err?.details,
        retryAfterSeconds: res.status === 429 ? parseRetryAfter(res.headers.get("Retry-After")) : undefined,
      });
    }

    if (typeof body !== "object" || body === null || !("data" in body)) {
      throw new ApiClientError("internal_error", DEFAULT_MESSAGES.internal_error, res.status, {
        details: "La respuesta no trae `data`.",
      });
    }
    return body as Envelope<T>;
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener("abort", forward);
  }
}

export async function getMeta(opts: RequestOptions = {}): Promise<MetaDTO> {
  return (await request<MetaDTO>("/meta", undefined, opts)).data;
}

export async function searchProducts(params: SearchParams = {}, opts: RequestOptions = {}): Promise<SearchPage> {
  const { data, meta } = await request<ProductDTO[]>(
    "/search",
    {
      q: params.q?.trim(),
      category: params.category,
      subcategory: params.subcategory,
      chain: params.chain,
      offers: params.offers ? "true" : undefined,
      sort: params.sort,
      limit: params.limit,
      offset: params.offset,
    },
    opts,
  );
  if (!meta) throw new ApiClientError("internal_error", DEFAULT_MESSAGES.internal_error, 200, { details: "La búsqueda no trae `meta`." });
  return { items: data, page: meta };
}

export async function getProduct(slug: string, loc?: LocationParam, opts: RequestOptions = {}): Promise<ProductDetailDTO> {
  const query = loc && "comuna" in loc ? { comuna: loc.comuna } : loc ? { lat: loc.lat, lng: loc.lng } : undefined;
  return (await request<ProductDetailDTO>(`/products/${encodeURIComponent(slug)}`, query, opts)).data;
}

export async function getListings(slug: string, opts: RequestOptions = {}): Promise<ListingDTO[]> {
  return (await request<ListingDTO[]>(`/products/${encodeURIComponent(slug)}/listings`, undefined, opts)).data;
}

export async function getTrend(slug: string, opts: RequestOptions = {}): Promise<TrendDTO> {
  return (await request<TrendDTO>(`/products/${encodeURIComponent(slug)}/trend`, undefined, opts)).data;
}

export async function getCategories(aisles = false, opts: RequestOptions = {}): Promise<DepartmentDTO[]> {
  return (await request<DepartmentDTO[]>("/categories", { aisles: aisles ? "true" : undefined }, opts)).data;
}

/** 404 (`not_found`) significa que ese código de barras aún no está en PayRight. */
export async function lookupBarcode(ean: string, opts: RequestOptions = {}): Promise<{ slug: string }> {
  return (await request<{ slug: string }>(`/barcode/${encodeURIComponent(ean)}`, undefined, opts)).data;
}
