/**
 * Medidas de la etiqueta tipográfica de LabelTile (cuando no hay foto). Calcula, para un recuadro de `size` px,
 * el mayor tamaño de letra con que la marca cabe sin partirse a media palabra ni salirse del recuadro, y si
 * sobra espacio para el formato ("1 L"). Función pura: la prueba corre en Node.
 *
 * Prioridad (como en la web: la marca manda): marca > emoji > formato. El formato solo se muestra si la marca
 * sigue en ≥ 14 px con él; si no, gana una marca más grande.
 */
export type LabelFit = {
  /** Tamaño de letra de la marca. */
  head: number;
  /** Líneas estimadas de la marca. */
  lines: number;
  /** Tamaño del emoji, 0 si no cabe. */
  emoji: number;
  /** Cabe el formato (11 px) bajo la marca. */
  foot: boolean;
  pad: number;
};

const CHAR = 0.62; // ancho medio de un carácter de Bricolage ExtraBold, en em (con margen)
const LEADING = 1.08;
const FOOT_H = 15;
const MIN_HEAD = 10;
const MAX_LINES = 3;

export const labelPad = (size: number) => Math.max(6, Math.round(size * 0.09));

/** Líneas que ocupa `words` en un ancho `width` con letra `head`; null si una palabra sola no cabe. */
function wrap(words: string[], head: number, width: number): number | null {
  const cw = head * CHAR;
  let lines = 1;
  let used = 0;
  for (const word of words) {
    const w = word.length * cw;
    if (w > width) return null;
    if (used === 0) used = w;
    else if (used + cw * 0.4 + w <= width) used += cw * 0.4 + w;
    else {
      lines += 1;
      used = w;
    }
  }
  return lines;
}

function best(words: string[], size: number, reserved: number, minHead: number): { head: number; lines: number } | null {
  const pad = labelPad(size);
  const width = size - 2 * pad;
  const height = size - 2 * pad - reserved;
  for (let head = Math.min(Math.round(size * 0.2), 28); head >= minHead; head--) {
    const lines = wrap(words, head, width);
    if (lines !== null && lines <= MAX_LINES && lines * head * LEADING <= height) return { head, lines };
  }
  return null;
}

export function fitLabel(word: string, size: number, wantFoot: boolean): LabelFit {
  const words = word.split(/\s+/).filter(Boolean);
  const pad = labelPad(size);
  const emoji = Math.round(size * 0.26);
  const emojiH = Math.round(emoji * 1.2) + 4;
  if (wantFoot) {
    const withFoot = best(words, size, emojiH + FOOT_H, 14);
    if (withFoot) return { ...withFoot, emoji, foot: true, pad };
  }
  const withEmoji = best(words, size, emojiH, MIN_HEAD);
  if (withEmoji) return { ...withEmoji, emoji, foot: false, pad };
  // Ni así cabe (palabras largas en un recuadro chico): sin emoji, la marca a todo lo que dé, cortada en 2 líneas.
  const bare = best(words, size, 0, MIN_HEAD);
  if (bare) return { ...bare, emoji: 0, foot: false, pad };
  return { head: MIN_HEAD, lines: 2, emoji: 0, foot: false, pad };
}
