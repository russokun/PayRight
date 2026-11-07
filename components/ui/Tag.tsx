import type { ReactNode } from "react";
import { Text, View } from "react-native";

/**
 * Marca de oferta o descuento: lima de fondo con tinta encima. Es el único lugar donde el lima lleva
 * texto, y es válido porque el texto va en tinta sobre el propio lima (nunca lima sobre fondo claro).
 */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <View className="self-start rounded-md bg-accent px-1.5 py-0.5">
      <Text className="font-sans-bold text-xs leading-4 text-accent-ink">{children}</Text>
    </View>
  );
}
