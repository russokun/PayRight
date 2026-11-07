import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RegionDTO } from '../../types/api';
import { communePlace, filterCommunes, normalizeText } from './communes';

const c = (name: string, region: string, lat = -33, lng = -70) => ({
  name,
  value: `${region}|${name}`,
  lat,
  lng,
});

const REGIONS: RegionDTO[] = [
  {
    slug: 'metropolitana',
    name: 'Metropolitana de Santiago',
    communes: [
      c('Santiago', 'metropolitana'),
      c('Ñuñoa', 'metropolitana'),
      c('Maipú', 'metropolitana'),
      c('Puente Alto', 'metropolitana'),
      c('Providencia', 'metropolitana'),
    ],
  },
  {
    slug: 'valparaiso',
    name: 'Valparaíso',
    communes: [
      c('Valparaíso', 'valparaiso'),
      c('Viña del Mar', 'valparaiso'),
      c('Santo Domingo', 'valparaiso'),
    ],
  },
  {
    slug: 'nuble',
    name: 'Ñuble',
    communes: [c('Chillán', 'nuble'), c('Bulnes', 'nuble')],
  },
];

const names = (q: string) => filterCommunes(REGIONS, q).map((m) => m.name);

describe('normalizeText', () => {
  it('quita tildes, diéresis y la tilde de la eñe, y baja a minúsculas', () => {
    assert.equal(normalizeText('Ñuñoa'), 'nunoa');
    assert.equal(normalizeText('  Maipú '), 'maipu');
    assert.equal(normalizeText('VIÑA   del Mar'), 'vina del mar');
    assert.equal(normalizeText('Pingüino'), 'pinguino');
  });
});

describe('filterCommunes', () => {
  it('sin texto devuelve todas las comunas en orden alfabético sin tildes', () => {
    const all = names('');
    assert.equal(all.length, 10);
    assert.deepEqual(all.slice(0, 3), ['Bulnes', 'Chillán', 'Maipú']);
  });

  it('ignora tildes y mayúsculas, en ambos sentidos', () => {
    assert.deepEqual(names('nunoa'), ['Ñuñoa']);
    assert.deepEqual(names('ÑUÑOA'), ['Ñuñoa']);
    assert.deepEqual(names('maipu'), ['Maipú']);
    assert.deepEqual(names('maipú'), ['Maipú']);
    assert.deepEqual(names('vina'), ['Viña del Mar']);
  });

  it('devuelve la comuna con su región', () => {
    const [m] = filterCommunes(REGIONS, 'nunoa');
    assert.equal(m.region, 'Metropolitana de Santiago');
    assert.equal(m.regionSlug, 'metropolitana');
    assert.equal(m.place, 'Ñuñoa, Metropolitana de Santiago');
    assert.equal(m.value, 'metropolitana|Ñuñoa');
  });

  it('primero las que empiezan con el texto, luego una palabra que empieza así, luego las que lo contienen', () => {
    // «san»: Santiago y Santo Domingo empiezan así; ninguna otra tiene una palabra que empiece con «san»
    assert.deepEqual(names('san'), ['Santiago', 'Santo Domingo']);
    // «alto» solo es palabra de «Puente Alto»; «ent» está dentro de «Puente» (contiene)
    assert.deepEqual(names('alto'), ['Puente Alto']);
    // «ent»: «Puente Alto» la contiene en la palabra; ninguna empieza con «ent»
    assert.deepEqual(names('ent'), ['Puente Alto']);
    // «al»: empieza con «al» → «Puente Alto» (palabra «alto»); contiene «al» → «Valparaíso» (val), «Providencia»? no
    const al = names('al');
    assert.equal(al[0], 'Puente Alto');
    assert.ok(al.includes('Valparaíso'));
  });

  it('solo busca por el nombre de la comuna: el de la región no trae todas sus comunas', () => {
    assert.deepEqual(names('valparaiso'), ['Valparaíso']);
    assert.deepEqual(names('metropolitana'), []);
    assert.deepEqual(names('santiago'), ['Santiago']);
  });

  it('dos comunas con el mismo nombre en regiones distintas aparecen las dos, cada una con su región', () => {
    const regions: RegionDTO[] = [
      { slug: 'a', name: 'Región A', communes: [c('Coronel', 'a')] },
      { slug: 'b', name: 'Región B', communes: [c('Coronel', 'b')] },
    ];
    assert.deepEqual(
      filterCommunes(regions, 'coronel').map((m) => m.place),
      ['Coronel, Región A', 'Coronel, Región B'],
    );
  });

  it('sin coincidencias, lista vacía', () => {
    assert.deepEqual(names('zzzz'), []);
  });

  it('espacios de más no cambian el resultado', () => {
    assert.deepEqual(names('  puente   alto '), ['Puente Alto']);
  });

  it('sin regiones, nada', () => {
    assert.deepEqual(filterCommunes([], 'a'), []);
  });
});

describe('communePlace', () => {
  it('une comuna y región', () => {
    assert.equal(
      communePlace('Ñuñoa', 'Metropolitana de Santiago'),
      'Ñuñoa, Metropolitana de Santiago',
    );
  });
});
