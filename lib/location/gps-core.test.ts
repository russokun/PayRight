import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  gpsProblem,
  locate,
  type GpsDeps,
  type GpsPermission,
} from './gps-core';

function deps(over: Partial<GpsDeps> = {}): { deps: GpsDeps; calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    deps: {
      getPermission: async () => {
        calls.push('get');
        return { granted: false, canAskAgain: true };
      },
      requestPermission: async () => {
        calls.push('request');
        return { granted: true, canAskAgain: true };
      },
      servicesEnabled: async () => {
        calls.push('services');
        return true;
      },
      getPosition: async () => {
        calls.push('position');
        return { lat: -33.4569, lng: -70.5975 };
      },
      ...over,
    },
  };
}

const perm =
  (granted: boolean, canAskAgain: boolean): (() => Promise<GpsPermission>) =>
  async () => ({ granted, canAskAgain });

describe('locate', () => {
  it('sin permiso aún: lo pide y devuelve la posición', async () => {
    const d = deps();
    assert.deepEqual(await locate(d.deps, 100), {
      status: 'granted',
      lat: -33.4569,
      lng: -70.5975,
    });
    assert.deepEqual(d.calls, ['get', 'request', 'services', 'position']);
  });

  it('con permiso ya dado, no vuelve a preguntar', async () => {
    const d = deps({ getPermission: perm(true, true) });
    assert.equal((await locate(d.deps, 100)).status, 'granted');
    assert.ok(!d.calls.includes('request'));
  });

  it('dijo que no pero se puede volver a preguntar: denied', async () => {
    const d = deps({ requestPermission: perm(false, true) });
    assert.deepEqual(await locate(d.deps, 100), { status: 'denied' });
    assert.ok(!d.calls.includes('position'));
  });

  it('el sistema ya no pregunta (denegado para siempre): blocked, sin intentar pedirlo', async () => {
    const d = deps({ getPermission: perm(false, false) });
    assert.deepEqual(await locate(d.deps, 100), { status: 'blocked' });
    assert.ok(!d.calls.includes('request'));
  });

  it('al decir que no en el diálogo, si el sistema ya no deja preguntar: blocked', async () => {
    const d = deps({ requestPermission: perm(false, false) });
    assert.deepEqual(await locate(d.deps, 100), { status: 'blocked' });
  });

  it('GPS apagado: unavailable, sin pedir posición', async () => {
    const d = deps({ servicesEnabled: async () => false });
    assert.deepEqual(await locate(d.deps, 100), { status: 'unavailable' });
    assert.ok(!d.calls.includes('position'));
  });

  it('sin respuesta a tiempo: timeout', async () => {
    const d = deps({ getPosition: () => new Promise(() => {}) });
    const t0 = Date.now();
    assert.deepEqual(await locate(d.deps, 30), { status: 'timeout' });
    assert.ok(Date.now() - t0 < 1000);
  });

  it('una lectura que falla después del tiempo no deja una promesa rechazada sin manejar', async () => {
    let rejectLate: (e: Error) => void = () => {};
    const d = deps({
      getPosition: () => new Promise((_, rej) => (rejectLate = rej)),
    });
    assert.deepEqual(await locate(d.deps, 10), { status: 'timeout' });
    rejectLate(new Error('tarde'));
    await new Promise((r) => setTimeout(r, 10)); // si quedara sin manejar, el proceso de pruebas fallaría
  });

  it('la lectura falla: unavailable', async () => {
    const d = deps({
      getPosition: async () => {
        throw new Error('E_LOCATION_UNAVAILABLE');
      },
    });
    assert.deepEqual(await locate(d.deps, 100), { status: 'unavailable' });
  });

  it('el módulo lanza al pedir permiso: unavailable, nunca una excepción', async () => {
    const d = deps({
      getPermission: async () => {
        throw new Error('sin permisos en este navegador');
      },
    });
    assert.deepEqual(await locate(d.deps, 100), { status: 'unavailable' });
  });

  it('coordenadas imposibles no se aceptan', async () => {
    for (const bad of [
      { lat: NaN, lng: 0 },
      { lat: 120, lng: 0 },
      { lat: 0, lng: -200 },
    ]) {
      const d = deps({ getPosition: async () => bad });
      assert.deepEqual(await locate(d.deps, 100), { status: 'unavailable' });
    }
  });
});

describe('gpsProblem', () => {
  it('cada desenlace tiene su mensaje y su acción', () => {
    assert.equal(gpsProblem({ status: 'denied' }).action, 'retry');
    assert.equal(gpsProblem({ status: 'blocked' }).action, 'settings');
    assert.equal(gpsProblem({ status: 'timeout' }).action, 'retry');
    assert.equal(gpsProblem({ status: 'unavailable' }).action, 'retry');
    assert.match(gpsProblem({ status: 'blocked' }).hint, /Ajustes/);
    for (const status of [
      'denied',
      'blocked',
      'timeout',
      'unavailable',
    ] as const) {
      assert.match(gpsProblem({ status }).hint, /comuna/);
    }
  });
});
