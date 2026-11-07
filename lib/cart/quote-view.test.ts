import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  absentLabel,
  chainNote,
  coverageLabel,
  hasCompleteChain,
  headline,
  itemName,
  missingLabel,
  missingNames,
  mixSummary,
  shareMessage,
  stopsLabel,
  winnerOf,
} from './quote-view';
import { ITEMS, JUMBO, LIDER, QUOTE_COMPARABLE, QUOTE_ONLY_ONE, QUOTE_PARTIAL, UNIMARC } from './quote.fixtures';

describe('winnerOf / hasCompleteChain', () => {
  it('el ganador es la primera cadena', () => {
    assert.equal(winnerOf(QUOTE_COMPARABLE)?.chain.slug, 'jumbo');
    assert.equal(winnerOf(QUOTE_COMPARABLE)?.complete, true);
    assert.equal(hasCompleteChain(QUOTE_COMPARABLE), true);
  });
  it('sin cadenas no hay ganador', () => {
    assert.equal(winnerOf({ ...QUOTE_COMPARABLE, chains: [] }), null);
  });
  it('si nadie tiene todo, «ganador» no es completo', () => {
    assert.equal(winnerOf(QUOTE_PARTIAL)?.complete, false);
    assert.equal(hasCompleteChain(QUOTE_PARTIAL), false);
  });
});

describe('coverageLabel', () => {
  it('«Tiene todo» o «Tiene N de M»', () => {
    assert.equal(coverageLabel(JUMBO, 3), 'Tiene todo');
    assert.equal(coverageLabel(UNIMARC, 3), 'Tiene 2 de 3');
  });
});

describe('headline', () => {
  it('comparable: dice el ahorro frente a la más cara y a la segunda solo si es otra', () => {
    const h = headline(QUOTE_COMPARABLE)!;
    assert.equal(h.kicker, 'El más barato es');
    assert.equal(h.saving, 'Ahorras $600 frente a Líder');
    // vs_second es la misma cadena que vs_worst: no se repite
    assert.equal(h.second, null);
    assert.equal(h.caveat, null);
  });

  it('comparable con segunda distinta del peor: dice las dos', () => {
    const q = {
      ...QUOTE_COMPARABLE,
      vs_worst: { chain: 'Tottus', amount: 1500 },
      vs_second: { chain: 'Líder', amount: 600 },
    };
    const h = headline(q)!;
    assert.equal(h.saving, 'Ahorras $1.500 frente a Tottus');
    assert.equal(h.second, '$600 menos que Líder, la segunda');
  });

  it('NO comparable: lo dice y no calcula ahorro, aunque la API mande vs_*', () => {
    const q = { ...QUOTE_PARTIAL, vs_worst: { chain: 'X', amount: 999 }, vs_second: { chain: 'Y', amount: 999 } };
    const h = headline(q)!;
    assert.equal(h.kicker, 'Ninguna cadena tiene todos tus productos');
    assert.equal(h.saving, null);
    assert.equal(h.second, null);
    assert.match(h.caveat ?? '', /Unimarc es la que más tiene: 2 de 3/);
  });

  it('una sola cadena con todo: «Solo lo tiene», sin ahorro', () => {
    const h = headline(QUOTE_ONLY_ONE)!;
    assert.equal(h.kicker, 'Solo lo tiene');
    assert.equal(h.saving, null);
  });

  it('un ahorro de $0 no se anuncia', () => {
    const h = headline({ ...QUOTE_COMPARABLE, vs_worst: { chain: 'Líder', amount: 0 }, vs_second: null })!;
    assert.equal(h.saving, null);
  });

  it('sin cadenas no hay titular', () => {
    assert.equal(headline({ ...QUOTE_COMPARABLE, chains: [] }), null);
  });
});

describe('chainNote', () => {
  it('la primera comparable es «El más barato»; las demás, su diferencia', () => {
    assert.equal(chainNote(QUOTE_COMPARABLE, JUMBO, 0), 'El más barato');
    assert.equal(chainNote(QUOTE_COMPARABLE, LIDER, 1), '+$600');
    assert.equal(chainNote(QUOTE_COMPARABLE, UNIMARC, 2), 'Total parcial');
  });
  it('sin comparación, nadie es «el más barato»', () => {
    assert.equal(chainNote(QUOTE_PARTIAL, QUOTE_PARTIAL.chains[0], 0), 'Total parcial');
  });
});

describe('productos que faltan y cadenas ausentes', () => {
  it('missingNames traduce slugs a nombres y omite los desconocidos', () => {
    assert.deepEqual(missingNames(UNIMARC, ITEMS), ['Pan de molde']);
    assert.deepEqual(missingNames({ missing: ['nada'] }, ITEMS), []);
  });
  it('missingLabel singular y plural', () => {
    assert.equal(missingLabel(['Pan']), 'Falta Pan');
    assert.equal(missingLabel(['Pan', 'Leche']), 'Faltan Pan, Leche');
    assert.equal(missingLabel([]), null);
  });
  it('absentLabel', () => {
    assert.equal(absentLabel([]), null);
    assert.equal(absentLabel(['Tottus']), 'Tottus no tiene precio para ningún producto de tu lista.');
    assert.equal(absentLabel(['Líder', 'Tottus']), 'Líder y Tottus no tienen precio para ningún producto de tu lista.');
    assert.equal(absentLabel(['A', 'B', 'C']), 'A, B y C no tienen precio para ningún producto de tu lista.');
  });
});

describe('shareMessage', () => {
  it('usa el mensaje del servidor tal cual', () => {
    assert.equal(shareMessage(QUOTE_COMPARABLE), QUOTE_COMPARABLE.share.message);
  });
  it('sin cotización o mensaje vacío, no se ofrece', () => {
    assert.equal(shareMessage(undefined), null);
    assert.equal(shareMessage(null), null);
    assert.equal(shareMessage({ ...QUOTE_COMPARABLE, share: { url: '', message: '  ' } }), null);
  });
});

describe('mixSummary', () => {
  it('con ahorro: lo dice con las paradas', () => {
    const m = mixSummary(QUOTE_COMPARABLE)!;
    assert.equal(m.stops, 2);
    assert.equal(m.saving, 'Ahorras $300 más si repartes la compra en 2 paradas');
    assert.equal(m.note, null);
  });
  it('sin ahorro: dice que un solo lugar ya es lo más barato', () => {
    const q = { ...QUOTE_COMPARABLE, mix: { ...QUOTE_COMPARABLE.mix!, saving_vs_best: 0 } };
    const m = mixSummary(q)!;
    assert.equal(m.saving, null);
    assert.match(m.note ?? '', /un solo lugar/);
  });
  it('si la cotización no es comparable no afirma ahorro', () => {
    const q = { ...QUOTE_COMPARABLE, comparable: false };
    const m = mixSummary(q)!;
    assert.equal(m.saving, null);
    assert.match(m.note ?? '', /ninguna tiene toda tu lista/);
  });
  it('sin mix, nada', () => {
    assert.equal(mixSummary(QUOTE_PARTIAL), null);
  });
});

describe('textos menores', () => {
  it('stopsLabel', () => {
    assert.equal(stopsLabel(1), '1 parada');
    assert.equal(stopsLabel(3), '3 paradas');
  });
  it('itemName cae al slug si no está', () => {
    assert.equal(itemName(ITEMS, 'leche'), 'Leche entera');
    assert.equal(itemName(ITEMS, 'x'), 'x');
  });
});
