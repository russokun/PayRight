import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { UserLocation } from '../../store/useLocationStore';
import { locationLabel, shouldAdoptPlace } from './place';

const gps = (over: Partial<UserLocation> = {}): UserLocation => ({
  lat: -33.457,
  lng: -70.598,
  place: null,
  source: 'gps',
  ...over,
});

describe('shouldAdoptPlace', () => {
  const api = {
    lat: -33.457,
    lng: -70.598,
    place: 'Ñuñoa, Metropolitana de Santiago',
  };

  it('adopta el nombre cuando el GPS no tiene y la respuesta es del mismo punto', () => {
    assert.equal(shouldAdoptPlace(gps(), api), true);
  });

  it('tolera una diferencia mínima de redondeo', () => {
    assert.equal(
      shouldAdoptPlace(gps(), { ...api, lat: -33.4571, lng: -70.5984 }),
      true,
    );
  });

  it('no pisa un nombre que ya existe (comuna elegida)', () => {
    assert.equal(
      shouldAdoptPlace(
        gps({ place: 'Maipú, Metropolitana de Santiago', source: 'comuna' }),
        api,
      ),
      false,
    );
  });

  it('no usa la respuesta de otro punto (una consulta tardía de la ubicación anterior)', () => {
    assert.equal(
      shouldAdoptPlace(gps(), { ...api, lat: -33.9, lng: -70.7 }),
      false,
    );
  });

  it('no hace nada sin ubicación, sin respuesta o con nombre vacío', () => {
    assert.equal(shouldAdoptPlace(null, api), false);
    assert.equal(shouldAdoptPlace(gps(), undefined), false);
    assert.equal(shouldAdoptPlace(gps(), null), false);
    assert.equal(shouldAdoptPlace(gps(), { ...api, place: '  ' }), false);
  });
});

describe('locationLabel', () => {
  it('usa el nombre del lugar; sin él, dice de dónde viene la ubicación', () => {
    assert.equal(
      locationLabel(gps({ place: 'Ñuñoa, Metropolitana de Santiago' })),
      'Ñuñoa, Metropolitana de Santiago',
    );
    assert.equal(locationLabel(gps()), 'Tu ubicación actual');
    assert.equal(locationLabel(gps({ source: 'comuna' })), 'Tu comuna');
    assert.equal(locationLabel(null), 'Sin ubicación');
  });
});
