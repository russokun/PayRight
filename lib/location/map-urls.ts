/**
 * URLs públicas de Google Maps (sin llave): cómo llegar a una sucursal y todos los supermercados alrededor de un punto.
 * Lógica pura (sin react-native) para poder probarla; `lib/maps.ts` las abre.
 */

export type LatLng = { lat: number; lng: number };

/** Coordenadas con sentido: finitas y dentro del globo. */
export function isLatLng(p: LatLng): boolean {
  return (
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lng) <= 180
  );
}

/**
 * Ruta hasta un punto. Va solo con coordenadas: un nombre junto a ellas hace que Google Maps busque el nombre
 * y pueda mandar a otro local; el punto exacto de la sucursal es lo que importa.
 */
export const directionsUrl = (to: LatLng): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${to.lat.toFixed(6)},${to.lng.toFixed(6)}`;

/** Google Maps buscando «supermercados» alrededor de un punto: todos, no solo las cadenas que PayRight lista. */
export const supermarketsNearUrl = (at: LatLng): string =>
  `https://www.google.com/maps/search/supermercados/@${at.lat.toFixed(5)},${at.lng.toFixed(5)},15z`;
