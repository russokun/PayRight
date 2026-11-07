import 'expo-sqlite/localStorage/install';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  MAX_DISTINCT,
  addItem,
  clear,
  mergeLines,
  pruneUnknown,
  qtyOf,
  removeItem,
  sanitizeLines,
  setQty,
  unitsCount,
  type CartLine,
  type CartProduct,
  type CartStatus,
} from '@/lib/cart/cart';

/**
 * El carrito: vive SOLO en el dispositivo (expo-sqlite/localStorage, incluido en Expo Go). El servidor lo cotiza sin
 * estado (`POST /cart/quote`). Toda la lógica está en `lib/cart/cart.ts` (pura y probada); este store solo la envuelve y
 * persiste. Lo que se lee del almacenamiento se valida (`sanitizeLines`): un dato dañado nunca rompe la app.
 */
type CartState = {
  lines: CartLine[];
  /** Productos que la API dijo que ya no existen y se quitaron (para avisarlo). No se guarda en el dispositivo. */
  pruned: CartLine[];
  /** Suma `qty` (1 por defecto). Devuelve si un tope impidió algo. */
  add: (product: CartProduct, qty?: number) => CartStatus;
  setQty: (slug: string, qty: number) => CartStatus;
  remove: (slug: string) => void;
  clear: () => void;
  /** Reemplaza el carrito (p. ej. al cargar una lista guardada). */
  replace: (lines: CartLine[]) => void;
  /** Suma líneas al carrito. */
  merge: (lines: CartLine[]) => { status: CartStatus; dropped: number };
  /** Quita los productos desconocidos para la API y los anota en `pruned`. Devuelve los quitados. */
  prune: (unknownSlugs: readonly string[]) => CartLine[];
  dismissPruned: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      pruned: [],
      add: (product, qty = 1) => {
        const r = addItem(get().lines, product, qty);
        if (r.changed) set({ lines: r.lines });
        return r.status;
      },
      setQty: (slug, qty) => {
        const r = setQty(get().lines, slug, qty);
        if (r.changed) set({ lines: r.lines });
        return r.status;
      },
      remove: (slug) => {
        const r = removeItem(get().lines, slug);
        if (r.changed) set({ lines: r.lines });
      },
      clear: () => set({ lines: clear() }),
      replace: (lines) => set({ lines: sanitizeLines(lines) }),
      merge: (lines) => {
        const r = mergeLines(get().lines, lines);
        if (r.changed) set({ lines: r.lines });
        return { status: r.status, dropped: r.dropped };
      },
      prune: (unknownSlugs) => {
        const r = pruneUnknown(get().lines, unknownSlugs);
        if (r.removed.length === 0) return [];
        set({ lines: r.lines, pruned: [...get().pruned, ...r.removed] });
        return r.removed;
      },
      dismissPruned: () => set({ pruned: [] }),
    }),
    {
      name: 'payright.cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
      merge: (persisted, current) => ({
        ...current,
        lines: sanitizeLines((persisted as { lines?: unknown } | undefined)?.lines),
      }),
    },
  ),
);

/** Unidades en total (la insignia de la pestaña). Un número: no re-renderiza por cambios que no lo mueven. */
export function useCartUnits(): number {
  return useCartStore((s) => unitsCount(s.lines));
}

/** Cantidad de ese producto en el carrito (0 si no está). */
export function useCartQty(slug: string): number {
  return useCartStore((s) => qtyOf(s.lines, slug));
}

/** Las líneas del carrito, con referencia estable mientras no cambien. */
export function useCartLines(): CartLine[] {
  return useCartStore((s) => s.lines);
}

/** ¿El carrito tiene ya el máximo de productos distintos? */
export function useCartIsFull(): boolean {
  return useCartStore((s) => s.lines.length >= MAX_DISTINCT);
}

/** Las acciones del carrito (referencias estables: no provocan renders). */
export function useCartActions() {
  const add = useCartStore((s) => s.add);
  const setQtyFn = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const clearFn = useCartStore((s) => s.clear);
  return useMemo(
    () => ({ add, setQty: setQtyFn, remove, clear: clearFn }),
    [add, setQtyFn, remove, clearFn],
  );
}
