import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { contrast, parseHex, readableOn } from "./color";
import { fonts } from "./fonts";
import { brand, colors, cssName, type ThemeColors } from "./tokens";

const root = join(__dirname, "..");
const css = readFileSync(join(root, "global.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Variables de un bloque `{ ... }` de global.css → { nombre: "r g b" }. */
function vars(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
const rootBlock = /:root\s*\{([^}]*)\}/.exec(css)![1];
const darkBlock = /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([^}]*)\}/.exec(css)![1];
const light = vars(rootBlock);
const dark = { ...light, ...vars(darkBlock) }; // lo que el modo oscuro no redeclara, hereda del claro

const channels = (hex: string) => parseHex(hex)!.join(" ");
const keys = Object.keys(colors.light) as (keyof ThemeColors)[];

describe("global.css ↔ theme/tokens.ts", () => {
  for (const [scheme, declared] of [["light", light], ["dark", dark]] as const) {
    it(`${scheme}: cada token coincide`, () => {
      for (const key of keys) {
        assert.equal(declared[cssName(key)], channels(colors[scheme][key]), `--${cssName(key)} (${scheme})`);
      }
    });
  }
  it("global.css no declara variables que tokens.ts no conozca", () => {
    assert.deepEqual(Object.keys(light).sort(), keys.map(cssName).sort());
  });
});

describe("tailwind.config.js ↔ tokens y fuentes", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const extend = require(join(root, "tailwind.config.js")).theme.extend;
  it("un color de Tailwind por token, apuntando a su variable", () => {
    assert.deepEqual(Object.keys(extend.colors).sort(), keys.map(cssName).sort());
    for (const [name, value] of Object.entries(extend.colors)) {
      assert.equal(value, `rgb(var(--${name}) / <alpha-value>)`);
    }
  });
  it("las familias tipográficas son las de theme/fonts.ts", () => {
    assert.deepEqual(Object.values(extend.fontFamily).flat().sort(), Object.values(fonts).sort());
  });
});

describe("contraste AA (4,5:1) de los pares de texto", () => {
  const pairs: [string, keyof ThemeColors, keyof ThemeColors][] = [
    ["ink/bg", "ink", "bg"],
    ["ink/surface", "ink", "surface"],
    ["muted/bg", "muted", "bg"],
    ["muted/surface", "muted", "surface"],
    ["muted/surface-2", "muted", "surface2"],
    ["primary-ink/primary", "primaryInk", "primary"],
    ["field-ink/field", "fieldInk", "field"],
    ["accent-ink/accent", "accentInk", "accent"],
    ["save/save-bg", "save", "saveBg"],
    ["save/bg", "save", "bg"],
    ["alert/surface", "alert", "surface"],
  ];
  for (const scheme of ["light", "dark"] as const) {
    for (const [label, fg, bg] of pairs) {
      it(`${scheme} · ${label}`, () => {
        const ratio = contrast(parseHex(colors[scheme][fg])!, parseHex(colors[scheme][bg])!);
        assert.ok(ratio >= 4.5, `${label} en ${scheme}: ${ratio.toFixed(2)}:1`);
      });
    }
  }
});

describe("excepción documentada", () => {
  // En claro, #c23a18 sobre #fbe4dc da 4,40:1 (la web declara AA; falta 0,1). Hasta que la web lo ajuste, la app no pone
  // texto corrido en `alert` sobre `alert-bg`: los avisos usan texto `ink` y el ícono en `alert` (Notice). Lo
  // que sí se permite: texto grande o en negrita (3:1).
  it("alert sobre alert-bg: ≥ 3:1 en claro y AA en oscuro", () => {
    assert.ok(contrast(parseHex(colors.light.alert)!, parseHex(colors.light.alertBg)!) >= 3);
    assert.ok(contrast(parseHex(colors.dark.alert)!, parseHex(colors.dark.alertBg)!) >= 4.5);
  });
});

describe("lima: nunca como texto sobre fondo claro", () => {
  it("el lima sobre papel/superficie claros no llega a AA (por eso solo va como fondo)", () => {
    assert.ok(contrast(parseHex(brand.lime)!, parseHex(colors.light.bg)!) < 3);
  });
  it("la tinta sobre lima sí", () => {
    assert.ok(contrast(parseHex(brand.ink)!, parseHex(brand.lime)!) > 12);
  });
});

describe("readableOn (color de cadena de la API)", () => {
  it("tinta sobre fondos claros, papel sobre oscuros", () => {
    assert.equal(readableOn("#ffffff"), brand.ink);
    assert.equal(readableOn("#d8ff3c"), brand.ink);
    assert.equal(readableOn("#ffd400"), brand.ink);
    assert.equal(readableOn("#000000"), brand.paper);
    assert.equal(readableOn("#0b3d91"), brand.paper);
    assert.equal(readableOn("#3366ff"), "#ffffff"); // tono medio: el papel de marca da 4,48:1, el blanco 4,68:1
    assert.equal(readableOn("#00A651"), brand.ink);
  });
  it("acepta #rgb y #rrggbbaa", () => {
    assert.equal(readableOn("#fff"), brand.ink);
    assert.equal(readableOn("#000000ff"), brand.paper);
  });
  it("devuelve null con valores que no son hex", () => {
    assert.equal(readableOn("red"), null);
    assert.equal(readableOn(""), null);
    assert.equal(readableOn(null), null);
  });
  it("siempre ≥ 4,5:1 en una rejilla de colores", () => {
    for (let r = 0; r <= 255; r += 51) for (let g = 0; g <= 255; g += 51) for (let b = 0; b <= 255; b += 51) {
      const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
      const text = readableOn(hex)!;
      assert.ok(contrast(parseHex(text)!, parseHex(hex)!) >= 4.5, `${hex} con ${text}`);
    }
  });
});
