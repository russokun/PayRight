import { Check } from "lucide-react-native";
import { Pressable, Text } from "react-native";
import { useTheme } from "@/theme/useTheme";

/** Filtro en píldora (Ordenar, Supermercado, Solo ofertas). Seleccionado: tinta rellena y un visto (no solo color). */
export function Chip({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-11 flex-row items-center justify-center gap-1.5 rounded-full border px-4 ${
        selected ? "border-primary bg-primary" : "border-line bg-surface active:bg-surface-2"
      }`}
    >
      {selected && <Check size={16} strokeWidth={3} color={colors.primaryInk} />}
      <Text className={`font-sans-semibold text-sm ${selected ? "text-primary-ink" : "text-ink"}`}>{label}</Text>
    </Pressable>
  );
}
