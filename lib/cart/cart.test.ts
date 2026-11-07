import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MAX_DISTINCT,
  MAX_QTY,
  addItem,
  capMessage,
  clear,
  distinctCount,
  mergeLines,
  pruneUnknown,
  qtyOf,
  quoteSignature,
  removeItem,
  sanitizeLines,
  setQty,
  toQuoteRequest,
  unitsCount,
  type CartLine,
  type CartProduct,
} from './cart';

const product = (slug: string, extra: Partial<CartProduct> = {}): CartProduct => ({
  slug,
  name: `Producto ${slug}`,
  brand: 'Marca',
  size: '1 L',
  emoji: '🥛',
  image_url: null,
  ...extra,
});
const line = (slug: string, qty = 1): CartLine => ({ ...product(slug), qty });

/** n líneas distintas p0…p(n-1) de cantidad 1. */
const many = (n: number): CartLine[] => Array.from({ length: n }, (_, i) => line(`p${i}`));

describe('addItem', () => {
  it('agrega un producto nuevo al final con cantidad 1', () => {
    const r = addItem([line('a')], product('b'));
    assert.deepEqual(
      r.lines.map((l) => [l.slug, l.qty]),
      [
        ['a', 1],
        ['b', 1],
      ],
    );
    assert.equal(r.status, 'ok');
    assert.equal(r.changed, true);
  });

  it('suma cantidades si ya estaba y conserva su posición', () => {
    const start = [line('a', 2), line('b')];
    const r = addItem(start, product('a'), 3);
    assert.deepEqual(
      r.lines.map((l) => [l.slug, l.qty]),
      [
        ['a', 5],
        ['b', 1],
      ],
    );
    assert.equal(r.status, 'ok');
  });

  it('no muta la lista de entrada', () => {
    const start = [line('a')];
    const copy = JSON.parse(JSON.stringify(start));
    addItem(start, product('a'), 2);
    addItem(start, product('b'));
    assert.deepEqual(start, copy);
  });

  it('refresca la instantánea con los datos más nuevos', () => {
    const r = addItem([line('a')], product('a', { name: 'Nombre nuevo', image_url: 'https://x/y.jpg' }));
    assert.equal(r.lines[0].name, 'Nombre nuevo');
    assert.equal(r.lines[0].image_url, 'https://x/y.jpg');
  });

  it('la cantidad tope es 99: pasarse queda en 99 y lo dice', () => {
    const r = addItem([line('a', 98)], product('a'), 5);
    assert.equal(r.lines[0].qty, MAX_QTY);
    assert.equal(r.status, 'qty_capped');
    // ya en 99, sumar más no cambia nada pero también avisa
    const again = addItem(r.lines, product('a'));
    assert.equal(again.lines[0].qty, MAX_QTY);
    assert.equal(again.status, 'qty_capped');
  });

  it('un producto nuevo con más de 99 entra como 99', () => {
    const r = addItem([], product('a'), 500);
    assert.equal(r.lines[0].qty, MAX_QTY);
    assert.equal(r.status, 'qty_capped');
  });

  it('con 60 productos distintos un nuevo NO entra y dice `full`', () => {
    const full = many(MAX_DISTINCT);
    const r = addItem(full, product('nuevo'));
    assert.equal(r.status, 'full');
    assert.equal(r.changed, false);
    assert.equal(r.lines, full);
    assert.equal(r.lines.length, MAX_DISTINCT);
  });

  it('con 60 productos, uno que ya estaba sí suma', () => {
    const r = addItem(many(MAX_DISTINCT), product('p3'));
    assert.equal(r.status, 'ok');
    assert.equal(qtyOf(r.lines, 'p3'), 2);
    assert.equal(r.lines.length, MAX_DISTINCT);
  });

  it('el producto 60 entra; el 61 no', () => {
    const r59 = many(MAX_DISTINCT - 1);
    const r60 = addItem(r59, product('ultimo'));
    assert.equal(r60.lines.length, MAX_DISTINCT);
    assert.equal(addItem(r60.lines, product('otro')).status, 'full');
  });

  it('cantidades no válidas no cambian nada', () => {
    for (const q of [0, -2, Number.NaN, Infinity, 0.4]) {
      const r = addItem([line('a')], product('a'), q);
      assert.equal(r.changed, false, String(q));
      assert.equal(r.status, 'ok');
    }
  });

  it('cantidades con decimales se truncan', () => {
    assert.equal(addItem([], product('a'), 2.9).lines[0].qty, 2);
  });
});

describe('setQty / removeItem / clear', () => {
  it('fija la cantidad exacta', () => {
    const r = setQty([line('a', 2), line('b')], 'a', 7);
    assert.equal(qtyOf(r.lines, 'a'), 7);
    assert.equal(qtyOf(r.lines, 'b'), 1);
    assert.equal(r.changed, true);
  });

  it('0 elimina la línea', () => {
    const r = setQty([line('a', 2), line('b')], 'a', 0);
    assert.deepEqual(
      r.lines.map((l) => l.slug),
      ['b'],
    );
    assert.equal(r.changed, true);
  });

  it('negativa también elimina', () => {
    assert.equal(setQty([line('a')], 'a', -3).lines.length, 0);
  });

  it('más de 99 queda en 99 y lo dice', () => {
    const r = setQty([line('a')], 'a', 120);
    assert.equal(r.lines[0].qty, MAX_QTY);
    assert.equal(r.status, 'qty_capped');
  });

  it('un slug que no está, o NaN, no toca nada', () => {
    const start = [line('a')];
    assert.equal(setQty(start, 'zzz', 3).lines, start);
    assert.equal(setQty(start, 'a', Number.NaN).lines, start);
    assert.equal(setQty(start, 'zzz', 3).changed, false);
  });

  it('la misma cantidad no cambia nada', () => {
    const start = [line('a', 3)];
    const r = setQty(start, 'a', 3);
    assert.equal(r.changed, false);
    assert.equal(r.lines, start);
  });

  it('removeItem quita solo ese producto', () => {
    const r = removeItem([line('a'), line('b'), line('c')], 'b');
    assert.deepEqual(
      r.lines.map((l) => l.slug),
      ['a', 'c'],
    );
  });

  it('removeItem de algo que no está devuelve la misma lista', () => {
    const start = [line('a')];
    const r = removeItem(start, 'zzz');
    assert.equal(r.lines, start);
    assert.equal(r.changed, false);
  });

  it('clear deja el carrito vacío', () => {
    assert.deepEqual(clear(), []);
  });
});

describe('conteos', () => {
  it('unitsCount suma cantidades; distinctCount cuenta líneas', () => {
    const lines = [line('a', 2), line('b', 3), line('c')];
    assert.equal(unitsCount(lines), 6);
    assert.equal(distinctCount(lines), 3);
    assert.equal(unitsCount([]), 0);
  });

  it('qtyOf es 0 si no está', () => {
    assert.equal(qtyOf([line('a', 4)], 'a'), 4);
    assert.equal(qtyOf([line('a', 4)], 'b'), 0);
  });
});

describe('mergeLines', () => {
  it('suma cantidades y agrega los nuevos', () => {
    const r = mergeLines([line('a', 2), line('b')], [line('a', 3), line('c', 2)]);
    assert.deepEqual(
      r.lines.map((l) => [l.slug, l.qty]),
      [
        ['a', 5],
        ['b', 1],
        ['c', 2],
      ],
    );
    assert.equal(r.status, 'ok');
    assert.equal(r.dropped, 0);
  });

  it('cuenta los que no caben por el tope de 60', () => {
    const r = mergeLines(many(58), [line('x'), line('y'), line('z')]);
    assert.equal(r.lines.length, MAX_DISTINCT);
    assert.equal(r.dropped, 1);
    assert.equal(r.status, 'full');
  });

  it('avisa cuando una suma pasa de 99', () => {
    const r = mergeLines([line('a', 90)], [line('a', 20)]);
    assert.equal(r.lines[0].qty, MAX_QTY);
    assert.equal(r.status, 'qty_capped');
  });

  it('sumar una lista vacía no cambia nada', () => {
    const start = [line('a')];
    const r = mergeLines(start, []);
    assert.equal(r.lines, start);
    assert.equal(r.changed, false);
  });
});

describe('toQuoteRequest', () => {
  it('solo slug y qty; sin ubicación no hay `location`', () => {
    const req = toQuoteRequest([line('a', 2), line('b')], null);
    assert.deepEqual(req, {
      items: [
        { slug: 'a', qty: 2 },
        { slug: 'b', qty: 1 },
      ],
    });
    assert.equal('location' in req, false);
  });

  it('con coordenadas las envía', () => {
    assert.deepEqual(toQuoteRequest([line('a')], { lat: -33.45, lng: -70.66 }).location, { lat: -33.45, lng: -70.66 });
  });

  it('con comuna envía la comuna', () => {
    assert.deepEqual(toQuoteRequest([line('a')], { comuna: 'metropolitana|Ñuñoa' }).location, {
      comuna: 'metropolitana|Ñuñoa',
    });
  });

  it('respeta los topes de la API aunque la entrada los viole', () => {
    const req = toQuoteRequest([...many(70), { ...line('gordo'), qty: 500 }].slice(0, 70), null);
    assert.equal(req.items.length, MAX_DISTINCT);
    const big = toQuoteRequest([{ ...line('a'), qty: 500 }, { ...line('b'), qty: 0 }], null);
    assert.deepEqual(
      big.items.map((i) => i.qty),
      [99, 1],
    );
  });

  it('un carrito vacío da una lista vacía', () => {
    assert.deepEqual(toQuoteRequest([], null), { items: [] });
  });
});

describe('quoteSignature', () => {
  it('no depende del orden de las líneas', () => {
    assert.equal(quoteSignature([line('a', 2), line('b')]), quoteSignature([line('b'), line('a', 2)]));
  });
  it('cambia con la cantidad y con los productos', () => {
    const base = quoteSignature([line('a', 2)]);
    assert.notEqual(base, quoteSignature([line('a', 3)]));
    assert.notEqual(base, quoteSignature([line('a', 2), line('b')]));
  });
  it('vacío es cadena vacía', () => {
    assert.equal(quoteSignature([]), '');
  });
});

describe('pruneUnknown', () => {
  it('quita los productos que la API ya no conoce y los devuelve', () => {
    const r = pruneUnknown([line('a'), line('b', 2), line('c')], ['b', 'zzz']);
    assert.deepEqual(
      r.lines.map((l) => l.slug),
      ['a', 'c'],
    );
    assert.deepEqual(
      r.removed.map((l) => l.slug),
      ['b'],
    );
  });

  it('sin coincidencias devuelve la MISMA lista (no dispara renders)', () => {
    const start = [line('a')];
    const r = pruneUnknown(start, ['x']);
    assert.equal(r.lines, start);
    assert.deepEqual(r.removed, []);
    assert.equal(pruneUnknown(start, []).lines, start);
  });

  it('puede dejar el carrito vacío', () => {
    assert.deepEqual(pruneUnknown([line('a')], ['a']).lines, []);
  });
});

describe('sanitizeLines', () => {
  it('descarta lo que no es una línea válida', () => {
    const out = sanitizeLines([
      null,
      'texto',
      { slug: '', qty: 2 },
      { slug: 'a' },
      { slug: 'b', qty: 0 },
      { slug: 'c', qty: 'x' },
      { slug: 'ok', qty: 2, name: 'Leche', brand: 'Colún', size: '1 L', emoji: '🥛', image_url: 'https://x/i.jpg' },
    ]);
    assert.equal(out.length, 1);
    assert.deepEqual(out[0], {
      slug: 'ok',
      qty: 2,
      name: 'Leche',
      brand: 'Colún',
      size: '1 L',
      emoji: '🥛',
      image_url: 'https://x/i.jpg',
    });
  });

  it('lo que no es un arreglo da carrito vacío', () => {
    for (const bad of [undefined, null, {}, 'x', 3]) assert.deepEqual(sanitizeLines(bad), []);
  });

  it('junta repetidos, acota a 99 y a 60 distintos', () => {
    const raw = [
      { slug: 'a', qty: 80 },
      { slug: 'a', qty: 80 },
      ...Array.from({ length: 80 }, (_, i) => ({ slug: `p${i}`, qty: 1 })),
    ];
    const out = sanitizeLines(raw);
    assert.equal(out.length, MAX_DISTINCT);
    assert.equal(qtyOf(out, 'a'), MAX_QTY);
  });

  it('completa los campos que faltan sin inventar datos', () => {
    const [l] = sanitizeLines([{ slug: 'leche', qty: 1 }]);
    assert.equal(l.name, 'leche');
    assert.equal(l.brand, '');
    assert.equal(l.image_url, null);
  });
});

describe('capMessage', () => {
  it('cada tope tiene su aviso; lo normal, ninguno', () => {
    assert.match(capMessage('full') ?? '', /60 productos/);
    assert.match(capMessage('qty_capped') ?? '', /99 unidades/);
    assert.equal(capMessage('ok'), null);
  });
});
