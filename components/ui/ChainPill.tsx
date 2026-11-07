import { Text, View } from "react-native";
import { readableOn } from "@/theme/color";

/**
 * Cadena como píldora. El color viene de la API (`chain_color`, cualquier hex): el texto se calcula por
 * luminancia para que siempre se lea (tinta, papel, o negro/blanco en tonos medios). Si el color no es un
 * hex válido, cae a una píldora neutra.
 */
export function ChainPill({ name, color }: { name: string; color: string }) {
  const text = readableOn(color);
  return (
    <View
      className={`self-start rounded-full border border-ink/15 px-2.5 py-1 ${text ? "" : "bg-surface-2"}`}
      style={text ? { backgroundColor: color } : undefined}
    >
      <Text numberOfLines={1} className={`font-sans-bold text-xs leading-4 ${text ? "" : "text-ink"}`} style={text ? { color: text } : undefined}>
        {name}
      </Text>
    </View>
  );
}
