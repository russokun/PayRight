import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { directionsUrl, isLatLng, supermarketsNearUrl } from './map-urls';

describe('directionsUrl', () => {
  it('pide la ruta por coordenadas con 6 decimales', () => {
    assert.equal(
      directionsUrl({ lat: -33.4569, lng: -70.5975 }),
      'https://www.google.com/maps/dir/?api=1&destination=-33.456900,-70.597500',
    );
  });
});

describe('supermarketsNearUrl', () => {
  it('busca «supermercados» alrededor del punto', () => {
    assert.equal(
      supermarketsNearUrl({ lat: -33.4569, lng: -70.5975 }),
      'https://www.google.com/maps/search/supermercados/@-33.45690,-70.59750,15z',
    );
  });
});

describe('isLatLng', () => {
  it('acepta coordenadas reales y rechaza NaN, infinito o fuera de rango', () => {
    assert.equal(isLatLng({ lat: -33.4, lng: -70.6 }), true);
    assert.equal(isLatLng({ lat: NaN, lng: -70.6 }), false);
    assert.equal(isLatLng({ lat: -33.4, lng: Infinity }), false);
    assert.equal(isLatLng({ lat: 91, lng: 0 }), false);
    assert.equal(isLatLng({ lat: 0, lng: 181 }), false);
  });
});
