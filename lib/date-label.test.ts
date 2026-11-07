import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { utcShortDate } from './date-label';

describe('utcShortDate', () => {
  it('lee el día en UTC, sin importar la zona del teléfono', () => {
    assert.equal(utcShortDate('2026-09-24T00:00:00.000Z'), '24 sep');
    assert.equal(utcShortDate('2026-11-05T00:00:00.000Z'), '5 nov');
    assert.equal(utcShortDate('2026-01-01T00:00:00.000Z'), '1 ene');
    assert.equal(utcShortDate('2026-12-31T23:59:59.000Z'), '31 dic');
  });
});
