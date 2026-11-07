import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_DISTINCT, qtyOf, type CartLine } from './cart';
import {
  MAX_LISTS,
  MAX_NAME,
  cleanName,
  defaultName,
  deleteList,
  loadList,
  renameList,
  sanitizeLists,
  saveList,
  saveMessage,
  type SavedList,
} from './lists';

const line = (slug: string, qty = 1): CartLine => ({
  slug,
  name: `Producto ${slug}`,
  brand: 'Marca',
  size: '1 L',
  emoji: '🛒',
  image_url: null,
  qty,
});

const NOW = new Date('2026-11-07T15:30:00Z');
let n = 0;
const opts = (at = NOW) => ({ id: `id${++n}`, now: at });

describe('nombres', () => {
  it('cleanName recorta, junta espacios y limita a 40', () => {
    assert.equal(cleanName('  Compra   del   mes '), 'Compra del mes');
    assert.equal(cleanName('x'.repeat(100)).length, MAX_NAME);
  });
  it('defaultName usa día-mes-año de Chile', () => {
    assert.equal(defaultName(new Date(2026, 10, 7)), 'Compra del 7-11-2026');
  });
});

describe('saveList', () => {
  it('guarda el carrito con su nombre, al principio', () => {
    const first = saveList([], 'Mes', [line('a', 2)], opts());
    assert.equal(first.status, 'saved');
    const second = saveList(first.lists, 'Fiesta', [line('b')], opts());
    assert.deepEqual(
      second.lists.map((l) => l.name),
      ['Fiesta', 'Mes'],
    );
    assert.equal(second.lists[0].saved_at, NOW.toISOString());
  });

  it('un carrito vacío no se guarda', () => {
    const r = saveList([], 'Mes', [], opts());
    assert.equal(r.status, 'empty_cart');
    assert.deepEqual(r.lists, []);
  });

  it('sin nombre usa el de por defecto', () => {
    const r = saveList([], '   ', [line('a')], opts(new Date(2026, 10, 7)));
    assert.equal(r.lists[0].name, 'Compra del 7-11-2026');
  });

  it('el mismo nombre (sin importar mayúsculas) reemplaza y conserva el id', () => {
    const a = saveList([], 'Mes', [line('a')], opts());
    const b = saveList(a.lists, 'MES', [line('b', 3)], opts());
    assert.equal(b.status, 'replaced');
    assert.equal(b.lists.length, 1);
    assert.equal(b.lists[0].id, a.lists[0].id);
    assert.equal(b.lists[0].name, 'MES');
    assert.equal(qtyOf(b.lists[0].lines, 'b'), 3);
  });

  it('máximo 12 listas: la 13 no entra, pero se puede reemplazar una', () => {
    let lists: SavedList[] = [];
    for (let i = 0; i < MAX_LISTS; i++) lists = saveList(lists, `Lista ${i}`, [line('a')], opts()).lists;
    assert.equal(lists.length, MAX_LISTS);
    const over = saveList(lists, 'Una más', [line('a')], opts());
    assert.equal(over.status, 'full');
    assert.equal(over.lists, lists);
    const replace = saveList(lists, 'lista 3', [line('z')], opts());
    assert.equal(replace.status, 'replaced');
    assert.equal(replace.lists.length, MAX_LISTS);
  });

  it('guarda una copia: editar el carrito después no toca la lista', () => {
    const cart = [line('a', 2)];
    const r = saveList([], 'Mes', cart, opts());
    cart[0].qty = 50;
    assert.equal(r.lists[0].lines[0].qty, 2);
  });

  it('no muta la lista de entrada', () => {
    const start = saveList([], 'Mes', [line('a')], opts()).lists;
    const copy = JSON.parse(JSON.stringify(start));
    saveList(start, 'Otra', [line('b')], opts());
    assert.deepEqual(start, copy);
  });
});

describe('loadList', () => {
  const list = saveList([], 'Mes', [line('a', 2), line('b')], opts()).lists[0];

  it('reemplazar deja exactamente la lista', () => {
    const r = loadList([line('x', 9)], list, 'replace');
    assert.deepEqual(
      r.lines.map((l) => [l.slug, l.qty]),
      [
        ['a', 2],
        ['b', 1],
      ],
    );
    assert.equal(r.dropped, 0);
  });

  it('sumar junta con lo que ya había', () => {
    const r = loadList([line('a', 3), line('x')], list, 'sum');
    assert.equal(qtyOf(r.lines, 'a'), 5);
    assert.equal(qtyOf(r.lines, 'b'), 1);
    assert.equal(qtyOf(r.lines, 'x'), 1);
  });

  it('sumar respeta el tope de 60 y cuenta lo que no cupo', () => {
    const full = Array.from({ length: MAX_DISTINCT }, (_, i) => line(`p${i}`));
    const r = loadList(full, list, 'sum');
    assert.equal(r.lines.length, MAX_DISTINCT);
    assert.equal(r.dropped, 2);
    assert.equal(r.status, 'full');
  });

  it('cargar no modifica la lista guardada', () => {
    const copy = JSON.parse(JSON.stringify(list));
    loadList([line('a', 90)], list, 'sum');
    loadList([], list, 'replace');
    assert.deepEqual(list, copy);
  });
});

describe('deleteList / renameList', () => {
  const lists = saveList(saveList([], 'Mes', [line('a')], opts()).lists, 'Fiesta', [line('b')], opts()).lists;

  it('borra por id', () => {
    const out = deleteList(lists, lists[0].id);
    assert.equal(out.length, 1);
    assert.equal(out[0].name, 'Mes');
  });

  it('borrar un id que no existe devuelve la misma lista', () => {
    assert.equal(deleteList(lists, 'nada'), lists);
  });

  it('renombra', () => {
    const r = renameList(lists, lists[1].id, '  Compra grande ');
    assert.equal(r.status, 'renamed');
    assert.equal(r.lists[1].name, 'Compra grande');
  });

  it('rechaza nombre vacío, repetido o una lista inexistente', () => {
    assert.equal(renameList(lists, lists[1].id, '   ').status, 'empty_name');
    assert.equal(renameList(lists, lists[1].id, 'fiesta').status, 'duplicate');
    assert.equal(renameList(lists, 'nada', 'X').status, 'not_found');
    // el propio nombre (cambiando mayúsculas) sí vale
    assert.equal(renameList(lists, lists[1].id, 'MES').status, 'renamed');
  });
});

describe('sanitizeLists', () => {
  it('descarta lo dañado y deja lo bueno', () => {
    const out = sanitizeLists([
      null,
      { id: '', name: 'x', lines: [{ slug: 'a', qty: 1 }] },
      { id: 'sin-lineas', name: 'x', lines: [] },
      { id: 'sin-nombre', name: '  ', lines: [{ slug: 'a', qty: 1 }] },
      { id: 'ok', name: 'Mes', saved_at: NOW.toISOString(), lines: [{ slug: 'a', qty: 2 }] },
      { id: 'ok', name: 'Repetida', lines: [{ slug: 'a', qty: 2 }] },
    ]);
    assert.deepEqual(
      out.map((l) => l.id),
      ['ok'],
    );
    assert.equal(out[0].lines[0].qty, 2);
  });
  it('no es un arreglo → vacío; y nunca pasa de 12', () => {
    assert.deepEqual(sanitizeLists('x'), []);
    const many = Array.from({ length: 20 }, (_, i) => ({ id: `i${i}`, name: `L${i}`, lines: [{ slug: 'a', qty: 1 }] }));
    assert.equal(sanitizeLists(many).length, MAX_LISTS);
  });
});

describe('saveMessage', () => {
  it('avisa lo que corresponde', () => {
    assert.match(saveMessage('empty_cart') ?? '', /vacío/);
    assert.match(saveMessage('full') ?? '', /12 listas/);
    assert.match(saveMessage('replaced') ?? '', /reemplazamos/);
    assert.equal(saveMessage('saved'), null);
  });
});
