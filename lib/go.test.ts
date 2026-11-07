import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { GoDTO, GoOptionDTO } from '../types/api';
import { isStoreUrl, OPEN_DELAY_MS, planGo } from './go';

const NOW = Date.parse('2026-11-07T15:00:00Z');

function option(over: Partial<GoOptionDTO> = {}): GoOptionDTO {
  return {
    chain: { slug: 'jumbo', name: 'Jumbo', color: '#00a651' },
    url: 'https://www.jumbo.cl/leche-entera-colun-1-l/p',
    price: 1090,
    list_price: null,
    live: true,
    available: true,
    status: 'verified',
    previous_price: null,
    seen_at: '2026-11-07T14:00:00Z',
    checked_at: '2026-11-07T15:00:00Z',
    ...over,
  };
}

const go = (options: GoOptionDTO[], target: string | null = options[0]?.chain.slug ?? null): GoDTO => ({ target, options });

describe('planGo: hay tienda a la que ir', () => {
  it('verificado: abre la url y dice el precio de ahora', () => {
    const plan = planGo(go([option()]), undefined, NOW);
    assert.equal(plan.kind, 'open');
    if (plan.kind !== 'open') return;
    assert.equal(plan.url, 'https://www.jumbo.cl/leche-entera-colun-1-l/p');
    assert.equal(plan.chainName, 'Jumbo');
    assert.equal(plan.price, 1090);
    assert.equal(plan.notice.tone, 'verified');
    assert.equal(plan.notice.title, 'Precio verificado ahora en Jumbo: $1.090');
    assert.equal(plan.delayMs, OPEN_DELAY_MS.verified);
  });

  it('cambió: dice antes y ahora, y espera más para que se lea', () => {
    const plan = planGo(go([option({ status: 'changed', price: 1190, previous_price: 1090 })]), undefined, NOW);
    assert.equal(plan.kind, 'open');
    if (plan.kind !== 'open') return;
    assert.equal(plan.notice.tone, 'changed');
    assert.equal(plan.notice.title, 'El precio cambió: antes $1.090, ahora $1.190');
    assert.match(plan.notice.detail ?? '', /^En Jumbo\./);
    assert.ok(plan.delayMs > OPEN_DELAY_MS.verified);
  });

  it('cambió sin precio anterior: solo dice el de ahora', () => {
    const plan = planGo(go([option({ status: 'changed', price: 990, previous_price: null })]), undefined, NOW);
    assert.equal(plan.notice.title, 'El precio cambió: ahora $990');
  });

  it('failed: te lleva igual con el precio de referencia y dice desde cuándo', () => {
    const plan = planGo(go([option({ status: 'failed', checked_at: null })]), undefined, NOW);
    assert.equal(plan.kind, 'open');
    if (plan.kind !== 'open') return;
    assert.equal(plan.notice.tone, 'unverified');
    assert.equal(plan.notice.title, 'No pudimos verificarlo; te llevamos igual con el precio de referencia');
    assert.match(plan.notice.detail ?? '', /Jumbo: \$1\.090 \(visto hace 1 h\)/);
    assert.doesNotMatch(plan.notice.detail ?? '', /no lee directamente/);
  });

  it('not_checked de una cadena que PayRight no lee: «recibido», nunca «visto», y avisa que es referencial', () => {
    const lider = option({
      chain: { slug: 'lider', name: 'Líder', color: '#0071ce' },
      url: 'https://www.lider.cl/catalogo/product/x',
      live: false,
      status: 'not_checked',
      checked_at: null,
      seen_at: '2026-11-07T10:00:00Z',
    });
    const plan = planGo(go([lider]), undefined, NOW);
    assert.equal(plan.kind, 'open');
    if (plan.kind !== 'open') return;
    assert.equal(plan.notice.title, 'No pudimos verificarlo; te llevamos igual con el precio de referencia');
    assert.match(plan.notice.detail ?? '', /recibido hace 5 h/);
    assert.match(plan.notice.detail ?? '', /PayRight no lee directamente la web de Líder/);
  });

  it('abre la opción que dice target, no la primera de la lista', () => {
    const jumbo = option({ price: 1290 });
    const si = option({ chain: { slug: 'santa-isabel', name: 'Santa Isabel', color: '#e30613' }, url: 'https://www.santaisabel.cl/p', price: 1090 });
    const plan = planGo(go([jumbo, si], 'santa-isabel'), undefined, NOW);
    assert.equal(plan.kind, 'open');
    if (plan.kind !== 'open') return;
    assert.equal(plan.chainSlug, 'santa-isabel');
    assert.equal(plan.url, 'https://www.santaisabel.cl/p');
  });
});

describe('planGo: no hay a dónde ir', () => {
  it('sin target ni cadena fija: «Ninguna tienda lo tiene ahora»', () => {
    const plan = planGo(go([option({ status: 'gone', available: false })], null), undefined, NOW);
    assert.deepEqual(plan.kind, 'none');
    assert.equal(plan.notice.title, 'Ninguna tienda lo tiene ahora');
  });

  it('sin opciones: también', () => {
    assert.equal(planGo({ target: null, options: [] }).notice.title, 'Ninguna tienda lo tiene ahora');
  });

  it('cadena fija que ya no lo tiene (gone): «Esa tienda ya no tiene el producto»', () => {
    const plan = planGo(go([option({ status: 'gone', available: false })], null), 'jumbo', NOW);
    assert.equal(plan.kind, 'none');
    assert.equal(plan.notice.title, 'Esa tienda ya no tiene el producto');
  });

  it('cadena fija sin ninguna opción: no afirma que «ya no» lo tenía', () => {
    const plan = planGo({ target: null, options: [] }, 'jumbo', NOW);
    assert.equal(plan.notice.title, 'Esa tienda no tiene el producto ahora');
  });

  it('target que no está en las opciones, sin stock o con una url que no es https: no abre nada', () => {
    for (const g of [
      go([option()], 'otra'),
      go([option({ available: false })]),
      go([option({ url: 'http://www.jumbo.cl/p' })]),
      go([option({ url: 'javascript:alert(1)' })]),
    ]) {
      const plan = planGo(g, undefined, NOW);
      assert.equal(plan.kind, 'none');
      assert.equal(plan.notice.title, 'No tenemos una página de la tienda a la que llevarte');
    }
  });
});

describe('isStoreUrl', () => {
  it('solo https con host', () => {
    assert.equal(isStoreUrl('https://www.jumbo.cl/p'), true);
    assert.equal(isStoreUrl('http://www.jumbo.cl/p'), false);
    assert.equal(isStoreUrl('https://'), false);
    assert.equal(isStoreUrl('//www.jumbo.cl/p'), false);
    assert.equal(isStoreUrl(''), false);
  });
});
