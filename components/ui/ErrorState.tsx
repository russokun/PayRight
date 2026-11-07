import { WifiOff } from "lucide-react-native";
import { Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { Button } from "./Button";

/** Algo falló al cargar: dice qué pasó y deja reintentar con un toque. */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="alert" className="items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-8">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-alert-bg">
        <WifiOff size={24} color={colors.alert} />
      </View>
      <Text className="text-center font-sans-semibold text-base leading-6 text-ink">{message}</Text>
      <Button title="Reintentar" variant="secondary" onPress={onRetry} />
    </View>
  );
}
