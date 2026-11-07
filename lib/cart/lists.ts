/**
 * Listas guardadas por nombre (lógica pura). Como en la web: «Guardar y empezar otra» congela el carrito bajo un nombre
 * para reutilizarlo el próximo mes. Máximo 12 listas, nombres de hasta 40 caracteres. Viven solo en el dispositivo.
 */
import { mergeLines, sanitizeLines, type CartChange, type CartLine } from './cart';

export const MAX_LISTS = 12;
export const MAX_NAME = 40;

export type SavedList = {
  id: string;
  name: string;
  /** ISO 8601 de cuándo se guardó (la más reciente va primero). */
  saved_at: string;
  lines: CartLine[];
};

export type SaveStatus = 'saved' | 'replaced' | 'full' | 'empty_cart';

/** Sin espacios de más y a lo más 40 caracteres. */
export function cleanName(name: string): string {
  return name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME).trim();
}

/** Nombre por defecto como el de la web (`Compra del 7-11-2026`, día-mes-año de Chile, sin `Intl`). */
export function defaultName(now: Date): string {
  return `Compra del ${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
}

const sameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * Guarda `lines` bajo `name` (vacío = nombre por defecto). Si ya hay una lista con ese nombre (sin importar mayúsculas)
 * se reemplaza (`replaced`) y pasa al principio; si no, se agrega al principio. Con 12 listas no cabe una nueva (`full`).
 */
export function saveList(
  lists: readonly SavedList[],
  name: string,
  lines: readonly CartLine[],
  opts: { id: string; now: Date },
): { lists: SavedList[]; status: SaveStatus; saved?: SavedList } {
  if (lines.length === 0) return { lists: lists as SavedList[], status: 'empty_cart' };
  const finalName = cleanName(name) || defaultName(opts.now);
  const existing = lists.find((l) => sameName(l.name, finalName));
  if (!existing && lists.length >= MAX_LISTS) return { lists: lists as SavedList[], status: 'full' };

  const saved: SavedList = {
    id: existing?.id ?? opts.id,
    name: finalName,
    saved_at: opts.now.toISOString(),
    // copia: guardar y luego editar el carrito no debe tocar la lista
    lines: lines.map((l) => ({ ...l })),
  };
  return {
    lists: [saved, ...lists.filter((l) => l !== existing)],
    status: existing ? 'replaced' : 'saved',
    saved,
  };
}

/**
 * Carga una lista en el carrito: `replace` lo reemplaza; `sum` la suma a lo que ya hay (cantidades que se suman, con los
 * topes de siempre; `dropped` = los que no cupieron).
 */
export function loadList(
  current: readonly CartLine[],
  list: SavedList,
  mode: 'replace' | 'sum',
): CartChange & { dropped: number } {
  if (mode === 'sum') return mergeLines(current, list.lines);
  const lines = sanitizeLines(list.lines);
  return { lines, status: 'ok', changed: true, dropped: 0 };
}

export function deleteList(lists: readonly SavedList[], id: string): SavedList[] {
  return lists.some((l) => l.id === id) ? lists.filter((l) => l.id !== id) : (lists as SavedList[]);
}

export type RenameStatus = 'renamed' | 'empty_name' | 'duplicate' | 'not_found';

/** Cambia el nombre. No acepta uno vacío ni el de otra lista. */
export function renameList(
  lists: readonly SavedList[],
  id: string,
  name: string,
): { lists: SavedList[]; status: RenameStatus } {
  const target = lists.find((l) => l.id === id);
  if (!target) return { lists: lists as SavedList[], status: 'not_found' };
  const finalName = cleanName(name);
  if (!finalName) return { lists: lists as SavedList[], status: 'empty_name' };
  if (lists.some((l) => l.id !== id && sameName(l.name, finalName)))
    return { lists: lists as SavedList[], status: 'duplicate' };
  return {
    lists: lists.map((l) => (l.id === id ? { ...l, name: finalName } : l)),
    status: 'renamed',
  };
}

/** Validación de lo que sale del almacenamiento: listas sin líneas, ids repetidos o más de 12 se descartan. */
export function sanitizeLists(raw: unknown): SavedList[] {
  if (!Array.isArray(raw)) return [];
  const out: SavedList[] = [];
  const ids = new Set<string>();
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id : '';
    const name = typeof o.name === 'string' ? cleanName(o.name) : '';
    const lines = sanitizeLines(o.lines);
    if (!id || !name || ids.has(id) || lines.length === 0) continue;
    ids.add(id);
    const at = typeof o.saved_at === 'string' && !Number.isNaN(Date.parse(o.saved_at)) ? o.saved_at : new Date(0).toISOString();
    out.push({ id, name, saved_at: at, lines });
    if (out.length >= MAX_LISTS) break;
  }
  return out;
}

/** Mensaje para la persona cuando guardar no se pudo (o reemplazó); `null` si fue un guardado normal. */
export function saveMessage(status: SaveStatus): string | null {
  if (status === 'empty_cart') return 'Tu carrito está vacío: agrega productos antes de guardar.';
  if (status === 'full') return `Ya tienes ${MAX_LISTS} listas guardadas, el máximo. Borra una para guardar otra.`;
  if (status === 'replaced') return 'Ya había una lista con ese nombre: la reemplazamos con tu carrito actual.';
  return null;
}
