import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { toQuoteRequest, type CartLine } from '@/lib/cart/cart';
import { QUOTE_COMPARABLE } from '@/lib/cart/quote.fixtures';
import { ApiClientError } from './client';
import { postQuote } from './cart-client';

const realFetch = globalThis.fetch;
type Call = { url: string; init?: RequestInit };
let calls: Call[] = [];

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  calls = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    return handler(url, init);
  }) as typeof fetch;
}

const line = (slug: string, qty: number): CartLine => ({
  slug,
  qty,
  name: slug,
  brand: '',
  size: '',
  emoji: '',
  image_url: null,
});

beforeEach(() => {
  calls = [];
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('postQuote', () => {
  it('hace POST JSON a /cart/quote con slug, qty y ubicación, y devuelve `data`', async () => {
    mockFetch(() => json(200, { data: QUOTE_COMPARABLE }));
    const body = toQuoteRequest([line('leche', 2), line('arroz', 1)], { lat: -33.45, lng: -70.66 });
    const quote = await postQuote(body);
    assert.deepEqual(quote, QUOTE_COMPARABLE);

    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/cart\/quote$/);
    assert.equal(calls[0].init?.method, 'POST');
    const headers = calls[0].init?.headers as Record<string, string>;
    assert.equal(headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
      items: [
        { slug: 'leche', qty: 2 },
        { slug: 'arroz', qty: 1 },
      ],
      location: { lat: -33.45, lng: -70.66 },
    });
  });

  it('sin ubicación el cuerpo no trae `location`', async () => {
    mockFetch(() => json(200, { data: QUOTE_COMPARABLE }));
    await postQuote(toQuoteRequest([line('leche', 1)], null));
    assert.equal('location' in JSON.parse(String(calls[0].init?.body)), false);
  });

  it('un 400 de la API es `invalid_request` con su mensaje', async () => {
    mockFetch(() =>
      json(400, { error: { code: 'invalid_request', message: 'Máximo 60 productos.', details: { items: 'too_many' } } }),
    );
    await assert.rejects(
      () => postQuote({ items: [] }),
      (e: unknown) =>
        e instanceof ApiClientError &&
        e.code === 'invalid_request' &&
        e.status === 400 &&
        e.message === 'Máximo 60 productos.',
    );
  });

  it('un 429 trae cuántos segundos esperar', async () => {
    mockFetch(() => json(429, { error: { code: 'rate_limited', message: 'Muchas consultas.' } }, { 'Retry-After': '12' }));
    await assert.rejects(
      () => postQuote({ items: [] }),
      (e: unknown) => e instanceof ApiClientError && e.code === 'rate_limited' && e.retryAfterSeconds === 12,
    );
  });

  it('una página HTML (el endpoint aún no existe) es un error tipado, no un cuelgue', async () => {
    mockFetch(() => new Response('<html>404</html>', { status: 404, headers: { 'content-type': 'text/html' } }));
    await assert.rejects(
      () => postQuote({ items: [] }),
      (e: unknown) => e instanceof ApiClientError && e.code === 'not_found' && e.status === 404,
    );
  });

  it('sin red es `network`', async () => {
    mockFetch(() => {
      throw new TypeError('fetch failed');
    });
    await assert.rejects(
      () => postQuote({ items: [] }),
      (e: unknown) => e instanceof ApiClientError && e.code === 'network',
    );
  });

  it('una respuesta sin `data` es `internal_error`', async () => {
    mockFetch(() => json(200, { nada: true }));
    await assert.rejects(
      () => postQuote({ items: [] }),
      (e: unknown) => e instanceof ApiClientError && e.code === 'internal_error',
    );
  });

  it('respeta la cancelación', async () => {
    mockFetch(() => json(200, { data: QUOTE_COMPARABLE }));
    const c = new AbortController();
    c.abort();
    await assert.rejects(() => postQuote({ items: [] }, { signal: c.signal }), (e: unknown) => (e as Error).name === 'AbortError');
    assert.equal(calls.length, 0);
  });
});
