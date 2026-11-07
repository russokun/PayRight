import { ActivityIndicator, Text, View } from "react-native";
import { Button } from "@/components/ui";
import { errorMessage } from "@/lib/api/errors";
import { useTrend } from "@/lib/api/queries";
import { money } from "@/lib/format";
import { useTheme } from "@/theme/useTheme";
import { TrendChart } from "./TrendChart";

/** "Cómo ha cambiado": tendencia semanal. Con menos de dos semanas de datos lo dice, no dibuja una línea vacía. */
export function TrendSection({ slug }: { slug: string }) {
  const { colors } = useTheme();
  const { data, isPending, isError, error, refetch } = useTrend(slug);

  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-display-extrabold text-xl text-ink">
        Cómo ha cambiado
      </Text>
      <View className="rounded-2xl border border-line bg-surface p-4">
        {data ? (
          data.points.length >= 2 ? (
            <View className="gap-3">
              <TrendChart trend={data} />
              {data.median_price !== null ? (
                <Text className="font-sans text-sm text-muted">Mediana de los últimos precios: {money(data.median_price)}</Text>
              ) : null}
            </View>
          ) : (
            <Text className="font-sans text-sm text-muted">
              Aún no hay suficientes semanas de datos para mostrar la tendencia. Aparece cuando se junten dos.
            </Text>
          )
        ) : isError ? (
          <View className="items-start gap-2">
            <Text className="font-sans text-sm text-muted">{errorMessage(error)}</Text>
            <Button title="Reintentar" variant="secondary" onPress={() => refetch()} />
          </View>
        ) : isPending ? (
          <View className="items-center py-6" accessibilityLabel="Cargando la tendencia">
            <ActivityIndicator color={colors.muted} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
