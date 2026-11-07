import { brand } from "./tokens";

export type RGB = [number, number, number];

/** `#rgb`, `#rrggbb` o `#rrggbbaa` (el alfa se ignora) → [r, g, b], o null si no es un color hex. */
export function parseHex(input: string | null | undefined): RGB | null {
  if (!input) return null;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(input.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Luminancia relativa WCAG 2.x (0 negro, 1 blanco). */
export function luminance([r, g, b]: RGB): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Razón de contraste WCAG entre dos colores (1 a 21). AA texto normal: ≥ 4,5. */
export function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5;
const BLACK = "#000000";
const WHITE = "#ffffff";

/**
 * Color de texto legible sobre `background`: tinta o papel de marca si alguno llega a AA (4,5:1); si el fondo es un
 * tono medio donde ninguno llega (p. ej. un azul #3366ff), negro o blanco puros. Es para el color de cadena que
 * llega de la API (cualquier hex): el texto siempre se lee. Null si `background` no es un hex válido.
 */
export function readableOn(background: string | null | undefined): string | null {
  const bg = parseHex(background);
  if (!bg) return null;
  const candidates = [brand.ink, brand.paper, BLACK, WHITE];
  const scored = candidates.map((c) => ({ color: c, ratio: contrast(bg, parseHex(c)!) }));
  const branded = scored.slice(0, 2).sort((a, b) => b.ratio - a.ratio)[0];
  if (branded.ratio >= AA) return branded.color;
  return scored.slice(2).sort((a, b) => b.ratio - a.ratio)[0].color;
}
