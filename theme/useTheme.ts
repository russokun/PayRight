import { useColorScheme } from "react-native";
import { colors, type Scheme, type ThemeColors } from "./tokens";

/**
 * Esquema activo (sigue al sistema) y su paleta en JS. Para estilos usa clases (`bg-surface`, `text-ink`);
 * este hook es para lo que no acepta className: StatusBar, barra de pestañas, íconos SVG, ActivityIndicator.
 */
export function useTheme(): { scheme: Scheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: Scheme = system === "dark" ? "dark" : "light";
  return { scheme, colors: colors[scheme] };
}
