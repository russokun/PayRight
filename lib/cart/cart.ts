/**
 * Lógica PURA del carrito (sin react-native ni expo-*): `npm test` la prueba con tsx y los stores solo la envuelven.
 *
 * El carrito vive en el dispositivo. Cada línea guarda una instantánea de lo que se muestra (`name`, `brand`, `size`,
 * `emoji`, `image_url`) para pintar el carrito sin red; el servidor solo cotiza `slug` + `qty` (POST /cart/quote).
 * Topes de la API: hasta 60 productos distintos, cantidad 1–99.
 */
import type { QuoteRequestDTO } from '@/types/api';

export const MAX_DISTINCT = 60;
export const MAX_QTY = 99;

/** Lo que de un producto necesita el carrito para pintarse sin red. */
export type CartProduct = {
  slug: string;
  name: string;
  brand: string;
  size: string;
  emoji: string;
  image_url: string | null;
};

export type CartLine = CartProduct & { qty: number };

/**
 * - `ok`: se hizo lo pedido (o no había nada que hacer).
 * - `qty_capped`: la cantidad pasó de 99 y quedó en 99.
 * - `full`: ya hay 60 productos distintos; el producto nuevo NO entró.
 */
export type CartStatus = 'ok' | 'qty_capped' | 'full';

export type CartChange = {
  lines: CartLine[];
  status: CartStatus;
  /** `false` cuando `lines` es la misma lista de entrada (nada cambió). */
  changed: boolean;
};

const unchanged = (lines: CartLine[], status: CartStatus = 'ok'): CartChange => ({
  lines,
  status,
  changed: false,
});

/** Cantidad entera válida, o `null` si no es un número. */
function wholeQty(n: unknown): number | null {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  return Math.floor(n);
}

export function findLine(lines: readonly CartLine[], slug: string): CartLine | undefined {
  return lines.find((l) => l.slug === slug);
}

/** Cuántas unidades de ese producto hay en el carrito (0 si no está). */
export function qtyOf(lines: readonly CartLine[], slug: string): number {
  return findLine(lines, slug)?.qty ?? 0;
}

/** Unidades en total (lo que cuenta la insignia de la pestaña). */
export function unitsCount(lines: readonly CartLine[]): number {
  let n = 0;
  for (const l of lines) n += l.qty;
  return n;
}

export function distinctCount(lines: readonly CartLine[]): number {
  return lines.length;
}

export function isFull(lines: readonly CartLine[]): boolean {
  return lines.length >= MAX_DISTINCT;
}

const snapshot = (p: CartProduct): CartProduct => ({
  slug: p.slug,
  name: p.name,
  brand: p.brand,
  size: p.size,
  emoji: p.emoji,
  image_url: p.image_url,
});

/**
 * Suma `qty` (por defecto 1) al producto; si no estaba, lo agrega al final. Refresca la instantánea con los datos
 * más nuevos. Con 60 productos distintos, uno nuevo no entra (`full`); pasado 99 la cantidad queda en 99 (`qty_capped`).
 */
export function addItem(lines: readonly CartLine[], product: CartProduct, qty = 1): CartChange {
  const add = wholeQty(qty);
  const current = lines as CartLine[];
  if (add === null || add < 1 || !product.slug) return unchanged(current);

  const index = lines.findIndex((l) => l.slug === product.slug);
  if (index === -1) {
    if (lines.length >= MAX_DISTINCT) return unchanged(current, 'full');
    const capped = add > MAX_QTY;
    return {
      lines: [...lines, { ...snapshot(product), qty: Math.min(add, MAX_QTY) }],
      status: capped ? 'qty_capped' : 'ok',
      changed: true,
    };
  }

  const prev = lines[index];
  const sum = prev.qty + add;
  const next: CartLine = { ...snapshot(product), qty: Math.min(sum, MAX_QTY) };
  const out = lines.slice();
  out[index] = next;
  return { lines: out, status: sum > MAX_QTY ? 'qty_capped' : 'ok', changed: true };
}

/** Fija la cantidad exacta. 0 (o menos) elimina la línea; más de 99 queda en 99. Un producto que no está no se toca. */
export function setQty(lines: readonly CartLine[], slug: string, qty: number): CartChange {
  const current = lines as CartLine[];
  const n = wholeQty(qty);
  const index = lines.findIndex((l) => l.slug === slug);
  if (n === null || index === -1) return unchanged(current);
  if (n <= 0) return removeItem(lines, slug);
  const next = Math.min(n, MAX_QTY);
  const status: CartStatus = n > MAX_QTY ? 'qty_capped' : 'ok';
  if (lines[index].qty === next) return unchanged(current, status);
  const out = lines.slice();
  out[index] = { ...lines[index], qty: next };
  return { lines: out, status, changed: true };
}

export function removeItem(lines: readonly CartLine[], slug: string): CartChange {
  if (!lines.some((l) => l.slug === slug)) return unchanged(lines as CartLine[]);
  return { lines: lines.filter((l) => l.slug !== slug), status: 'ok', changed: true };
}

/** El carrito vacío. */
export function clear(): CartLine[] {
  return [];
}

/**
 * Suma otra lista (p. ej. una lista guardada) al carrito: las cantidades se suman (tope 99) y los productos nuevos
 * entran mientras haya lugar. `dropped` cuenta los que no cupieron por el tope de 60.
 */
export function mergeLines(
  current: readonly CartLine[],
  incoming: readonly CartLine[],
): CartChange & { dropped: number } {
  let lines = current as CartLine[];
  let status: CartStatus = 'ok';
  let dropped = 0;
  let changed = false;
  for (const l of incoming) {
    const r = addItem(lines, l, l.qty);
    if (r.status === 'full') dropped += 1;
    else if (r.status === 'qty_capped' && status === 'ok') status = 'qty_capped';
    if (r.changed) changed = true;
    lines = r.lines;
  }
  return { lines, status: dropped > 0 ? 'full' : status, changed, dropped };
}

/**
 * Cuerpo de `POST /cart/quote`. Defensivo con los topes de la API (60 distintos, 1–99). La ubicación solo viaja si la
 * persona la dio: coordenadas, o `comuna`.
 */
export function toQuoteRequest(
  lines: readonly CartLine[],
  location?: { lat: number; lng: number } | { comuna: string } | null,
): QuoteRequestDTO {
  const items = lines
    .slice(0, MAX_DISTINCT)
    .map((l) => ({ slug: l.slug, qty: Math.min(MAX_QTY, Math.max(1, Math.floor(l.qty) || 1)) }));
  if (!location) return { items };
  if ('comuna' in location) return { items, location: { comuna: location.comuna } };
  return { items, location: { lat: location.lat, lng: location.lng } };
}

/** Firma estable de lo que se cotiza (sin importar el orden de las líneas): sirve de llave de caché. */
export function quoteSignature(lines: readonly CartLine[]): string {
  return lines
    .map((l) => `${l.slug}:${l.qty}`)
    .sort()
    .join('|');
}

/** Quita las líneas cuyo slug la API dice que ya no existe (`unknown_slugs`). Sin cambios devuelve la MISMA lista. */
export function pruneUnknown(
  lines: readonly CartLine[],
  unknownSlugs: readonly string[],
): { lines: CartLine[]; removed: CartLine[] } {
  if (unknownSlugs.length === 0) return { lines: lines as CartLine[], removed: [] };
  const unknown = new Set(unknownSlugs);
  const removed = lines.filter((l) => unknown.has(l.slug));
  if (removed.length === 0) return { lines: lines as CartLine[], removed: [] };
  return { lines: lines.filter((l) => !unknown.has(l.slug)), removed };
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/**
 * Lo que sale del almacenamiento del dispositivo no es de fiar (versiones viejas, datos dañados): se valida línea por
 * línea, se juntan repetidos, se acotan cantidades y se respeta el tope de 60.
 */
export function sanitizeLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  let lines: CartLine[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const o = item as Record<string, unknown>;
    const slug = str(o.slug).trim();
    const qty = wholeQty(o.qty);
    if (!slug || qty === null || qty < 1) continue;
    const product: CartProduct = {
      slug,
      name: str(o.name) || slug,
      brand: str(o.brand),
      size: str(o.size),
      emoji: str(o.emoji),
      image_url: typeof o.image_url === 'string' && o.image_url ? o.image_url : null,
    };
    const r = addItem(lines, product, qty);
    lines = r.lines;
  }
  return lines;
}

/** Aviso para la persona cuando un tope impidió algo; `null` si todo salió como se pidió. */
export function capMessage(status: CartStatus): string | null {
  if (status === 'full')
    return `Tu carrito ya tiene ${MAX_DISTINCT} productos distintos, el máximo. Quita alguno para agregar otro.`;
  if (status === 'qty_capped') return `El máximo es ${MAX_QTY} unidades por producto.`;
  return null;
}
