import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fitLabel, labelPad } from "./label-fit";

const heightOf = (fit: ReturnType<typeof fitLabel>) =>
  (fit.emoji ? Math.round(fit.emoji * 1.2) + 4 : 0) + fit.lines * fit.head * 1.08 + (fit.foot ? 15 : 0);

describe("fitLabel", () => {
  it("una marca corta cabe grande y deja el formato a 96 px", () => {
    const fit = fitLabel("Colun", 96, true);
    assert.equal(fit.foot, true);
    assert.ok(fit.head >= 14);
  });
  it("prioriza la marca: con dos palabras a 96 px renuncia al formato y la agranda", () => {
    const fit = fitLabel("Marca Demo", 96, true);
    assert.equal(fit.foot, false);
    assert.ok(fit.head >= 17, `head ${fit.head}`);
  });
  it("nunca se sale del recuadro (alto) en una rejilla de marcas y tamaños", () => {
    for (const word of ["Colun", "Marca Demo", "Aceites del Sur Demo", "Plátano", "Soprole", "Nestlé", "Granel"]) {
      for (const size of [60, 64, 76, 84, 96, 120, 174]) {
        const fit = fitLabel(word, size, true);
        const inner = size - 2 * fit.pad;
        assert.ok(heightOf(fit) <= inner + 0.5 || fit.head === 10, `${word} @${size}: ${heightOf(fit)} > ${inner}`);
      }
    }
  });
  it("no parte palabras: la palabra más larga cabe en una línea (cuando se puede)", () => {
    const fit = fitLabel("Miraflores", 84, false);
    const inner = 84 - 2 * labelPad(84);
    assert.ok("Miraflores".length * fit.head * 0.62 <= inner);
  });
  it("palabra imposible en recuadro chico: cae a un mínimo legible sin emoji", () => {
    const fit = fitLabel("Hipermercadoextralargo", 64, true);
    assert.equal(fit.head, 10);
    assert.equal(fit.emoji, 0);
  });
});
