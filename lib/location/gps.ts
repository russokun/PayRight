import * as Location from 'expo-location';
import { Linking } from 'react-native';
import { locate, type GpsResult } from './gps-core';

export { gpsProblem, GPS_TIMEOUT_MS, type GpsResult } from './gps-core';

/**
 * Pide permiso de ubicación en primer plano (solo mientras la app está abierta) y lee la posición del teléfono:
 * precisión «balanceada» (~100 m, suficiente para «cerca» y ahorra batería), con tope de 10 s. La posición se
 * usa en el dispositivo; a la API solo van `lat`/`lng` redondeadas.
 */
export function getGpsLocation(): Promise<GpsResult> {
  return locate({
    getPermission: () => Location.getForegroundPermissionsAsync(),
    requestPermission: () => Location.requestForegroundPermissionsAsync(),
    servicesEnabled: () => Location.hasServicesEnabledAsync(),
    getPosition: async () => {
      const p = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return { lat: p.coords.latitude, lng: p.coords.longitude };
    },
  });
}

/** Abre los Ajustes de la app para que la persona reactive la ubicación bloqueada. */
export async function openLocationSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    // sin pantalla de Ajustes que abrir: el mensaje ya dice dónde está
  }
}
