import * as WebBrowser from 'expo-web-browser';

/** Abre una página (la ficha de una cadena) en el navegador del sistema, con la barra de cierre de la app. */
export async function openExternal(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    // sin navegador disponible no hay nada más que hacer; la ficha sigue mostrando el precio
  }
}
