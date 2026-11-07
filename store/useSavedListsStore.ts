import 'expo-sqlite/localStorage/install';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CartLine } from '@/lib/cart/cart';
import {
  deleteList,
  renameList,
  sanitizeLists,
  saveList,
  type RenameStatus,
  type SaveStatus,
  type SavedList,
} from '@/lib/cart/lists';

/**
 * Listas guardadas por nombre (máx. 12), solo en el dispositivo. Igual que el carrito: la lógica es pura
 * (`lib/cart/lists.ts`) y este store la envuelve y persiste con clave propia.
 */
type ListsState = {
  lists: SavedList[];
  /** Guarda `lines` con ese nombre. El id y la fecha se generan aquí (la lógica pura los recibe). */
  save: (name: string, lines: readonly CartLine[]) => SaveStatus;
  remove: (id: string) => void;
  rename: (id: string, name: string) => RenameStatus;
};

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const useSavedListsStore = create<ListsState>()(
  persist(
    (set, get) => ({
      lists: [],
      save: (name, lines) => {
        const r = saveList(get().lists, name, lines, { id: newId(), now: new Date() });
        if (r.status === 'saved' || r.status === 'replaced') set({ lists: r.lists });
        return r.status;
      },
      remove: (id) => set({ lists: deleteList(get().lists, id) }),
      rename: (id, name) => {
        const r = renameList(get().lists, id, name);
        if (r.status === 'renamed') set({ lists: r.lists });
        return r.status;
      },
    }),
    {
      name: 'payright.saved-lists',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lists: s.lists }),
      merge: (persisted, current) => ({
        ...current,
        lists: sanitizeLists((persisted as { lists?: unknown } | undefined)?.lists),
      }),
    },
  ),
);
