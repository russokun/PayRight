import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApiClientError } from "./api/client";
import { cleanCode, resolveScan, type ScanDeps } from "./scan";

const VALID = "4006381333931";

function deps(impl: ScanDeps["lookupBarcode"]): { deps: ScanDeps; calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    deps: {
      lookupBarcode: async (ean, opts) => {
        calls.push(ean);
        return impl(ean, opts);
      },
    },
  };
}

describe("resolveScan", () => {
  it("un código con mal dígito verificador es inválido y no consulta la API", async () => {
    const d = deps(async () => ({ slug: "x" }));
    assert.deepEqual(await resolveScan("4006381333932", d.deps), { kind: "invalid" });
    assert.deepEqual(d.calls, []);
  });

  it("longitudes raras y texto son inválidos", async () => {
    const d = deps(async () => ({ slug: "x" }));
    for (const raw of ["", "123", "12345678901", "abc"]) {
      assert.deepEqual(await resolveScan(raw, d.deps), { kind: "invalid" });
    }
    assert.deepEqual(d.calls, []);
  });

  it("un código válido que existe devuelve el slug", async () => {
    const d = deps(async () => ({ slug: "leche-entera-colun-1-l" }));
    assert.deepEqual(await resolveScan(VALID, d.deps), { kind: "found", slug: "leche-entera-colun-1-l" });
    assert.deepEqual(d.calls, [VALID]);
  });

  it("limpia espacios y guiones de lo escrito a mano", async () => {
    const d = deps(async () => ({ slug: "ok" }));
    assert.deepEqual(await resolveScan("4006 3813-33931", d.deps), { kind: "found", slug: "ok" });
    assert.deepEqual(d.calls, [VALID]);
  });

  it("404 es not_found", async () => {
    const d = deps(async () => {
      throw new ApiClientError("not_found", "Ese código de barras aún no está en PayRight.", 404);
    });
    assert.deepEqual(await resolveScan(VALID, d.deps), { kind: "not_found" });
  });

  it("los demás errores de la API llevan su mensaje", async () => {
    const d = deps(async () => {
      throw new ApiClientError("rate_limited", "Muchas consultas.", 429, { retryAfterSeconds: 5 });
    });
    assert.deepEqual(await resolveScan(VALID, d.deps), { kind: "error", message: "Muchas consultas." });
  });

  it("sin red es error con mensaje", async () => {
    const d = deps(async () => {
      throw new ApiClientError("network", "Sin conexión.", 0);
    });
    assert.deepEqual(await resolveScan(VALID, d.deps), { kind: "error", message: "Sin conexión." });
  });

  it("un error desconocido da un mensaje genérico", async () => {
    const d = deps(async () => {
      throw new Error("boom");
    });
    const r = await resolveScan(VALID, d.deps);
    assert.equal(r.kind, "error");
  });

  it("una cancelación se propaga, no se convierte en error", async () => {
    const d = deps(async () => {
      const e = new Error("cancelado");
      e.name = "AbortError";
      throw e;
    });
    await assert.rejects(resolveScan(VALID, d.deps), { name: "AbortError" });
  });
});

describe("cleanCode", () => {
  it("deja solo dígitos y corta en 14", () => {
    assert.equal(cleanCode(" 7801-234 567890 "), "7801234567890");
    assert.equal(cleanCode("123456789012345678"), "12345678901234");
  });
});
