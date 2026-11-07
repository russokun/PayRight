import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { MetaDTO, ProductDTO } from "@/types/api";
import {
  ApiClientError,
  getCategories,
  getListings,
  getMeta,
  getProduct,
  getTrend,
  lookupBarcode,
  searchProducts,
} from "./client";
import { retryDelay, shouldRetry } from "./retry";
import { normalizeFilters } from "./queries";

const realFetch = globalThis.fetch;
type Call = { url: string; init?: RequestInit };
let calls: Call[] = [];

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  calls = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    return handler(url, init);
  }) as typeof fetch;
}

/** Un fetch que nunca responde, pero respeta la cancelación como el real. */
function hangingFetch() {
  calls = [];
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const e = new Error("The operation was aborted");
        e.name = "AbortError";
        reject(e);
      });
    });
  }) as typeof fetch;
}

const META: MetaDTO = {
  api_version: 1,
  chains: [{ slug: "jumbo", name: "Jumbo", color: "#16a34a", branches: 7, reads_web: true }],
  categories: [{ slug: "lacteos", name: "Lácteos y huevos", emoji: "🥛" }],
  is_demo: true,
  has_partner_prices: false,
  retailer_content: false,
};

const PRODUCT: ProductDTO = {
  slug: "leche-entera-colun-1-l",
  name: "Leche entera",
  brand: "Colún",
  size: "1 L",
  category: "lacteos",
  emoji: "🥛",
  unit: "ml",
  unit_qty: 1000,
  image_url: null,
  min_price: 1010,
  max_price: 1220,
  chains: 5,
  offers: 34,
  cheapest: null,
};

beforeEach(() => {
  calls = [];
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("sobre de la API", () => {
  it("getMeta devuelve `data`", async () => {
    mockFetch(() => json(200, { data: META }));
    assert.deepEqual(await getMeta(), META);
    assert.match(calls[0].url, /\/meta$/);
  });

  it("searchProducts devuelve items y la página, y arma la consulta", async () => {
    mockFetch(() => json(200, { data: [PRODUCT], meta: { total: 41, limit: 20, offset: 20, has_more: true } }));
    const r = await searchProducts({ q: " leche ", chain: "jumbo", offers: true, sort: "barato", limit: 20, offset: 20 });
    assert.deepEqual(r.items, [PRODUCT]);
    assert.deepEqual(r.page, { total: 41, limit: 20, offset: 20, has_more: true });
    const url = new URL(calls[0].url);
    assert.equal(url.pathname.endsWith("/search"), true);
    assert.equal(url.searchParams.get("q"), "leche");
    assert.equal(url.searchParams.get("chain"), "jumbo");
    assert.equal(url.searchParams.get("offers"), "true");
    assert.equal(url.searchParams.get("sort"), "barato");
    assert.equal(url.searchParams.get("offset"), "20");
    assert.equal(url.searchParams.has("category"), false);
  });

  it("searchProducts no envía filtros vacíos ni offers=false", async () => {
    mockFetch(() => json(200, { data: [], meta: { total: 0, limit: 20, offset: 0, has_more: false } }));
    await searchProducts({ q: "", offers: false, chain: undefined });
    assert.match(calls[0].url, /\/search$/);
  });

  it("codifica el texto con acentos y espacios", async () => {
    mockFetch(() => json(200, { data: [], meta: { total: 0, limit: 20, offset: 0, has_more: false } }));
    await searchProducts({ q: "café molido & té" });
    assert.match(calls[0].url, /q=caf%C3%A9%20molido%20%26%20t%C3%A9$/);
  });

  it("getProduct codifica el slug y envía la ubicación solo si hay", async () => {
    mockFetch(() => json(200, { data: { product: PRODUCT, prices: [] } }));
    await getProduct("leche entera/1");
    assert.match(calls[0].url, /\/products\/leche%20entera%2F1$/);
    await getProduct("x", { lat: -33.4, lng: -70.6 });
    assert.match(calls[1].url, /\/products\/x\?lat=-33\.4&lng=-70\.6$/);
    await getProduct("x", { comuna: "Ñuñoa" });
    assert.match(calls[2].url, /\/products\/x\?comuna=%C3%91u%C3%B1oa$/);
  });

  it("getListings, getTrend, getCategories y lookupBarcode usan su ruta", async () => {
    mockFetch(() => json(200, { data: [] }));
    await getListings("a");
    await getTrend("a");
    await getCategories(true);
    await getCategories();
    await lookupBarcode("4006381333931");
    assert.deepEqual(
      calls.map((c) => c.url.replace(/^.*\/api\/v1/, "")),
      ["/products/a/listings", "/products/a/trend", "/categories?aisles=true", "/categories", "/barcode/4006381333931"],
    );
  });

  it("una respuesta sin `data` es internal_error", async () => {
    mockFetch(() => json(200, { hola: 1 }));
    await assert.rejects(getMeta(), (e: unknown) => e instanceof ApiClientError && e.code === "internal_error" && e.status === 200);
  });

  it("una búsqueda sin `meta` es internal_error", async () => {
    mockFetch(() => json(200, { data: [] }));
    await assert.rejects(searchProducts({ q: "a" }), (e: unknown) => e instanceof ApiClientError && e.code === "internal_error");
  });
});

describe("errores", () => {
  it("400 invalid_request lleva details", async () => {
    const details = [{ param: "limit", message: "Debe ser un entero entre 1 y 50." }];
    mockFetch(() => json(400, { error: { code: "invalid_request", message: "Revisa los parámetros de la consulta.", details } }));
    await assert.rejects(searchProducts({ limit: 99 }), (e: unknown) => {
      assert.ok(e instanceof ApiClientError);
      assert.equal(e.code, "invalid_request");
      assert.equal(e.status, 400);
      assert.equal(e.message, "Revisa los parámetros de la consulta.");
      assert.deepEqual(e.details, details);
      return true;
    });
  });

  it("404 not_found", async () => {
    mockFetch(() => json(404, { error: { code: "not_found", message: "Ese código de barras aún no está en PayRight." } }));
    await assert.rejects(lookupBarcode("7800000000000"), (e: unknown) => e instanceof ApiClientError && e.code === "not_found" && e.status === 404);
  });

  it("429 rate_limited con Retry-After en segundos", async () => {
    mockFetch(() => json(429, { error: { code: "rate_limited", message: "Muchas consultas." } }, { "Retry-After": "12" }));
    await assert.rejects(getMeta(), (e: unknown) => {
      assert.ok(e instanceof ApiClientError);
      assert.equal(e.code, "rate_limited");
      assert.equal(e.retryAfterSeconds, 12);
      return true;
    });
  });

  it("429 con Retry-After como fecha HTTP", async () => {
    const at = new Date(Date.now() + 30_000).toUTCString();
    mockFetch(() => json(429, { error: { code: "rate_limited", message: "x" } }, { "Retry-After": at }));
    await assert.rejects(getMeta(), (e: unknown) => {
      assert.ok(e instanceof ApiClientError);
      assert.ok(e.retryAfterSeconds !== undefined && e.retryAfterSeconds >= 28 && e.retryAfterSeconds <= 31);
      return true;
    });
  });

  it("429 sin Retry-After no inventa uno", async () => {
    mockFetch(() => json(429, { error: { code: "rate_limited", message: "x" } }));
    await assert.rejects(getMeta(), (e: unknown) => e instanceof ApiClientError && e.retryAfterSeconds === undefined);
  });

  it("500 internal_error", async () => {
    mockFetch(() => json(500, { error: { code: "internal_error", message: "Algo falló." } }));
    await assert.rejects(getMeta(), (e: unknown) => e instanceof ApiClientError && e.code === "internal_error" && e.status === 500);
  });

  it("una página HTML de error (ruta que el servidor aún no tiene) se trata por su estado HTTP", async () => {
    mockFetch(() => new Response("<!DOCTYPE html><html>404</html>", { status: 404, headers: { "content-type": "text/html" } }));
    await assert.rejects(getCategories(), (e: unknown) => {
      assert.ok(e instanceof ApiClientError);
      assert.equal(e.code, "not_found");
      assert.equal(e.status, 404);
      assert.ok(e.message.length > 0);
      return true;
    });
  });

  it("502 sin cuerpo JSON es internal_error", async () => {
    mockFetch(() => new Response("Bad gateway", { status: 502 }));
    await assert.rejects(getMeta(), (e: unknown) => e instanceof ApiClientError && e.code === "internal_error" && e.status === 502);
  });

  it("red caída es `network`", async () => {
    globalThis.fetch = (async () => {
      throw new TypeError("Network request failed");
    }) as typeof fetch;
    await assert.rejects(getMeta(), (e: unknown) => {
      assert.ok(e instanceof ApiClientError);
      assert.equal(e.code, "network");
      assert.equal(e.status, 0);
      return true;
    });
  });

  it("sin respuesta pasado el plazo es `timeout`", async () => {
    hangingFetch();
    await assert.rejects(getMeta({ timeoutMs: 20 }), (e: unknown) => e instanceof ApiClientError && e.code === "timeout" && e.status === 0);
  });

  it("el plazo también corta una respuesta que se queda a medias", async () => {
    calls = [];
    globalThis.fetch = (async (_: RequestInfo | URL, init?: RequestInit) => {
      const body = new ReadableStream({
        start(controller) {
          init?.signal?.addEventListener("abort", () => controller.error(Object.assign(new Error("aborted"), { name: "AbortError" })));
        },
      });
      return new Response(body, { status: 200 });
    }) as typeof fetch;
    await assert.rejects(getMeta({ timeoutMs: 20 }), (e: unknown) => e instanceof ApiClientError && e.code === "timeout");
  });

  it("cancelar con la señal del llamador propaga AbortError, no un ApiClientError", async () => {
    hangingFetch();
    const ctl = new AbortController();
    const p = getMeta({ signal: ctl.signal });
    ctl.abort();
    await assert.rejects(p, (e: unknown) => e instanceof Error && e.name === "AbortError" && !(e instanceof ApiClientError));
  });

  it("una señal ya cancelada ni siquiera pide", async () => {
    hangingFetch();
    const ctl = new AbortController();
    ctl.abort();
    await assert.rejects(getMeta({ signal: ctl.signal }), (e: unknown) => e instanceof Error && e.name === "AbortError");
    assert.equal(calls.length, 0);
  });
});

describe("política de reintentos", () => {
  const err = (code: ApiClientError["code"], status: number) => new ApiClientError(code, "x", status);

  it("no reintenta los 4xx", () => {
    for (const status of [400, 404, 429]) assert.equal(shouldRetry(0, err("invalid_request", status)), false);
  });

  it("reintenta dos veces red, tiempo agotado y 5xx", () => {
    for (const e of [err("network", 0), err("timeout", 0), err("internal_error", 500), err("internal_error", 503)]) {
      assert.equal(shouldRetry(0, e), true);
      assert.equal(shouldRetry(1, e), true);
      assert.equal(shouldRetry(2, e), false);
    }
  });

  it("el retraso crece y tiene tope", () => {
    assert.deepEqual([0, 1, 2, 3, 4, 10].map(retryDelay), [1000, 2000, 4000, 8000, 8000, 8000]);
  });
});

describe("normalizeFilters", () => {
  it("descarta lo vacío para que compartan caché", () => {
    assert.deepEqual(normalizeFilters({ q: "  leche ", chain: undefined, offers: false, sort: "relevancia", category: "" }), { q: "leche" });
    assert.deepEqual(normalizeFilters({ q: "", offers: true, sort: "barato", category: "lacteos" }), {
      category: "lacteos",
      offers: true,
      sort: "barato",
    });
  });
});

describe("errorMessage", () => {
  it("usa el mensaje de la API y añade la espera de un 429", async () => {
    const { errorMessage } = await import("./errors");
    assert.equal(errorMessage(new ApiClientError("not_found", "No existe.", 404)), "No existe.");
    assert.equal(
      errorMessage(new ApiClientError("rate_limited", "Muchas consultas.", 429, { retryAfterSeconds: 8 })),
      "Muchas consultas. Espera 8 s.",
    );
    assert.equal(errorMessage(new Error("boom")), "Algo salió mal. Intenta de nuevo.");
  });
});
