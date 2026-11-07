import 'expo-sqlite/localStorage/install';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * La ubicación que la persona eligió: GPS o una comuna. Vive solo en el dispositivo (expo-sqlite/localStorage,
 * incluido en Expo Go) y viaja a la API únicamente como `lat`/`lng` en cada consulta que la usa.
 * Las coordenadas se redondean a 3 decimales (~110 m): suficiente para «cerca» y no guarda un punto exacto.
 */
export type UserLocation = {
  lat: number;
  lng: number;
  /** «Ñuñoa, Metropolitana de Santiago», cuando se conoce. */
  place: string | null;
  source: 'gps' | 'comuna';
};

type LocationState = {
  location: UserLocation | null;
  setLocation: (l: UserLocation) => void;
  clearLocation: () => void;
};

const round3 = (n: number) => Math.round(n * 1000) / 1000;

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      setLocation: (l) =>
        set({ location: { ...l, lat: round3(l.lat), lng: round3(l.lng) } }),
      clearLocation: () => set({ location: null }),
    }),
    {
      name: 'payright.location',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ location: s.location }),
    },
  ),
);

/** Lo que se envía a la API (`LocationParam`), o `null` sin ubicación. Referencia estable mientras no cambie. */
export function useApiLocation(): { lat: number; lng: number } | null {
  const lat = useLocationStore((s) => s.location?.lat);
  const lng = useLocationStore((s) => s.location?.lng);
  return useMemo(
    () => (lat === undefined || lng === undefined ? null : { lat, lng }),
    [lat, lng],
  );
}
