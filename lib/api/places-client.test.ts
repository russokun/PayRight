import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import type { GoDTO, NearbyDTO, RegionDTO, StoresDTO } from '@/types/api';
import { ApiClientError } from './client';
import {
  getCommunes,
  getGo,
  getNearby,
  getStores,
  GO_TIMEOUT_MS,
} from './places-client';

const realFetch = globalThis.fetch;
let calls: string[] = [];

function reply(body: unknown, status = 200): void {
  calls = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

const LOCATION = {
  lat: -33.457,
  lng: -70.598,
  place: 'Ñuñoa, Metropolitana de Santiago',
};

describe('getNearby', () => {
  it('pide /nearby con la ubicación redondeada a 3 decimales, el radio y el límite', async () => {
    reply({ data: [], meta: { location: LOCATION, radius_km: 10 } });
    await getNearby({
      lat: -33.4569412,
      lng: -70.5974999,
      radiusKm: 10,
      limit: 24,
    });
    assert.equal(calls.length, 1);
    const url = new URL(calls[0]);
    assert.equal(url.pathname.endsWith('/nearby'), true);
    assert.equal(url.searchParams.get('lat'), '-33.457');
    assert.equal(url.searchParams.get('lng'), '-70.597');
    assert.equal(url.searchParams.get('radius_km'), '10');
    assert.equal(url.searchParams.get('limit'), '24');
  });

  it('sin radio ni límite no los envía (la API usa 5 km y 24)', async () => {
    reply({ data: [], meta: { location: LOCATION, radius_km: 5 } });
    await getNearby({ lat: -33.457, lng: -70.598 });
    const url = new URL(calls[0]);
    assert.equal(url.searchParams.has('radius_km'), false);
    assert.equal(url.searchParams.has('limit'), false);
  });

  it('devuelve los precios y el meta (donde viene el nombre del lugar)', async () => {
    const item = { price: 1090, distance_km: 0.85 } as NearbyDTO;
    reply({ data: [item], meta: { location: LOCATION, radius_km: 5 } });
    const page = await getNearby({ lat: -33.457, lng: -70.598 });
    assert.deepEqual(page.items, [item]);
    assert.equal(page.meta.location.place, 'Ñuñoa, Metropolitana de Santiago');
  });

  it('una respuesta sin meta es un error, no un resultado a medias', async () => {
    reply({ data: [] });
    await assert.rejects(
      getNearby({ lat: -33.457, lng: -70.598 }),
      (e: unknown) =>
        e instanceof ApiClientError && e.code === 'internal_error',
    );
  });

  it('un 400 de la API llega como error tipado con su mensaje', async () => {
    reply(
      { error: { code: 'invalid_request', message: 'Falta la ubicación.' } },
      400,
    );
    await assert.rejects(
      getNearby({ lat: -33.457, lng: -70.598 }),
      (e: unknown) =>
        e instanceof ApiClientError &&
        e.code === 'invalid_request' &&
        e.message === 'Falta la ubicación.',
    );
  });
});

describe('getStores', () => {
  it('pide /stores con lat/lng redondeadas y devuelve la atribución en el meta', async () => {
    const stores: StoresDTO = { per_chain: [], nearest: [] };
    reply({
      data: stores,
      meta: {
        location: LOCATION,
        attribution: '© colaboradores de OpenStreetMap',
      },
    });
    const page = await getStores({ lat: -33.45694, lng: -70.59749, limit: 8 });
    const url = new URL(calls[0]);
    assert.equal(url.pathname.endsWith('/stores'), true);
    assert.equal(url.searchParams.get('lat'), '-33.457');
    assert.equal(url.searchParams.get('lng'), '-70.597');
    assert.equal(url.searchParams.get('limit'), '8');
    assert.deepEqual(page.stores, stores);
    assert.equal(page.meta.attribution, '© colaboradores de OpenStreetMap');
  });

  it('sin meta es un error', async () => {
    reply({ data: { per_chain: [], nearest: [] } });
    await assert.rejects(getStores({ lat: 0, lng: 0 }), ApiClientError);
  });
});

describe('getCommunes', () => {
  it('devuelve las regiones tal cual', async () => {
    const regions: RegionDTO[] = [
      {
        slug: 'nuble',
        name: 'Ñuble',
        communes: [
          { name: 'Chillán', value: 'nuble|Chillán', lat: -36.6, lng: -72.1 },
        ],
      },
    ];
    reply({ data: regions });
    assert.deepEqual(await getCommunes(), regions);
    assert.equal(new URL(calls[0]).pathname.endsWith('/communes'), true);
  });
});

describe('getGo', () => {
  const go: GoDTO = { target: 'jumbo', options: [] };

  it('pide /products/:slug/go sin chain cuando no se fija una', async () => {
    reply({ data: go });
    assert.deepEqual(await getGo('leche entera/1 l'), go);
    const url = new URL(calls[0]);
    assert.equal(
      url.pathname.endsWith('/products/leche%20entera%2F1%20l/go'),
      true,
    );
    assert.equal(url.searchParams.has('chain'), false);
  });

  it('con cadena fija la envía', async () => {
    reply({ data: go });
    await getGo('leche', 'santa-isabel');
    assert.equal(new URL(calls[0]).searchParams.get('chain'), 'santa-isabel');
  });

  it('espera más que una consulta normal: la API relee la tienda en vivo (~12 s)', () => {
    assert.ok(GO_TIMEOUT_MS >= 15_000);
  });

  it('se puede cancelar: la espera termina sin ser un error de la API', async () => {
    calls = [];
    globalThis.fetch = ((_: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_res, rej) => {
        init?.signal?.addEventListener('abort', () => {
          const e = new Error('aborted');
          e.name = 'AbortError';
          rej(e);
        });
      })) as typeof fetch;
    const ctl = new AbortController();
    const p = getGo('leche', undefined, { signal: ctl.signal });
    ctl.abort();
    await assert.rejects(
      p,
      (e: unknown) =>
        !(e instanceof ApiClientError) && (e as Error).name === 'AbortError',
    );
  });
});
