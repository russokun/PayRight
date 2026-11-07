import { Linking } from 'react-native';
import {
  directionsUrl,
  isLatLng,
  supermarketsNearUrl,
  type LatLng,
} from './location/map-urls';
import { openExternal } from './open-external';

export { directionsUrl, supermarketsNearUrl };

/** Abre una URL pública de mapas: la app de mapas si está instalada (enlace universal) o, si no, el navegador. */
async function openMapsUrl(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    // sin app que lo abra: el navegador del sistema
    await openExternal(url);
  }
}

/**
 * «Cómo llegar» a una sucursal. `name` es solo informativo: la ruta se pide por coordenadas (ver `directionsUrl`).
 * No lanza: si las coordenadas no sirven o no hay nada que abra el enlace, no hace nada.
 */
export async function openDirections(
  to: LatLng & { name?: string },
): Promise<void> {
  if (!isLatLng(to)) return;
  await openMapsUrl(directionsUrl(to));
}

/** «Ver todos los supermercados en Google Maps» alrededor de un punto. */
export async function openSupermarketsNear(at: LatLng): Promise<void> {
  if (!isLatLng(at)) return;
  await openMapsUrl(supermarketsNearUrl(at));
}
