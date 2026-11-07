import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { StoreDTO, StoresDTO } from '../../types/api';
import { FAR_KM, isFarAway, nearestStoreKm, splitStores } from './stores';

const store = (id: number, distance_km: number): StoreDTO => ({
  id,
  name: `Local ${id}`,
  commune: 'Ñuñoa',
  address: '',
  lat: -33.45,
  lng: -70.6,
  chain: { slug: 'jumbo', name: 'Jumbo', color: '#00a651' },
  distance_km,
  source: 'demo',
});

describe('splitStores', () => {
  it('quita de «otros» los que ya salen como el más cercano de su cadena', () => {
    const a = store(1, 0.8);
    const b = store(2, 1.1);
    const c = store(3, 1.9);
    const { perChain, others } = splitStores({
      per_chain: [a, b],
      nearest: [b, a, c],
    });
    assert.deepEqual(
      perChain.map((s) => s.id),
      [1, 2],
    );
    assert.deepEqual(
      others.map((s) => s.id),
      [3],
    );
  });

  it('listas vacías', () => {
    assert.deepEqual(splitStores({ per_chain: [], nearest: [] }), {
      perChain: [],
      others: [],
    });
  });
});

describe('nearestStoreKm / isFarAway', () => {
  it('toma la menor distancia de ambas listas', () => {
    const s: StoresDTO = {
      per_chain: [store(1, 3), store(2, 9)],
      nearest: [store(3, 0.4)],
    };
    assert.equal(nearestStoreKm(s), 0.4);
    assert.equal(isFarAway(s), false);
  });

  it('lejos: el más cercano pasa de FAR_KM', () => {
    const s: StoresDTO = {
      per_chain: [store(1, 1690)],
      nearest: [store(2, 1695)],
    };
    assert.equal(isFarAway(s), true);
    assert.equal(
      isFarAway({ per_chain: [store(1, FAR_KM)], nearest: [] }),
      false,
    );
    assert.equal(
      isFarAway({ per_chain: [store(1, FAR_KM + 0.1)], nearest: [] }),
      true,
    );
  });

  it('sin supermercados no hay distancia ni aviso', () => {
    assert.equal(nearestStoreKm({ per_chain: [], nearest: [] }), null);
    assert.equal(isFarAway({ per_chain: [], nearest: [] }), false);
  });
});
