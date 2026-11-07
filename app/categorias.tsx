import { Stack, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { Chip, EmptyState, ErrorState } from "@/components/ui";
import { errorMessage } from "@/lib/api/errors";
import { useCategories } from "@/lib/api/queries";
import { useTheme } from "@/theme/useTheme";
import type { DepartmentDTO } from "@/types/api";

const SHOWN_AISLES = 6;

/** Departamentos y sus pasillos. Un toque lleva a `/buscar` con el filtro. */
export default function CategoriesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isPending, isError, error, refetch } = useCategories(true);

  const open = (category: string, subcategory?: string) =>
    router.push({ pathname: "/buscar", params: subcategory ? { category, subcategory } : { category } });

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Categorías",
          headerBackButtonDisplayMode: "minimal",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerTitleStyle: { color: colors.ink },
        }}
      />
      {!data ? (
        isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        ) : isPending ? (
          <View className="flex-1 items-center justify-center" accessibilityLabel="Cargando categorías">
            <ActivityIndicator color={colors.muted} />
          </View>
        ) : null
      ) : (
        <FlatList<DepartmentDTO>
          data={data}
          keyExtractor={(d) => d.slug}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          contentInsetAdjustmentBehavior="automatic"
          ListHeaderComponent={
            <Pressable
              onPress={() => router.push("/buscar")}
              accessibilityRole="button"
              accessibilityLabel="Ver todos los productos"
              className="min-h-[52px] justify-center rounded-2xl bg-primary px-4 active:opacity-80"
            >
              <Text className="font-sans-bold text-base text-primary-ink">Todos los productos</Text>
            </Pressable>
          }
          ListEmptyComponent={<EmptyState title="Aún no hay categorías" hint="Vuelve en un rato: se llenan con los productos que tienen precio." />}
          renderItem={({ item }) => {
            const aisles = item.aisles ?? [];
            const more = aisles.length - SHOWN_AISLES;
            return (
              <View className="gap-3 rounded-2xl border border-line bg-surface p-4">
                <Pressable
                  onPress={() => open(item.slug)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, ${item.count} ${item.count === 1 ? "producto" : "productos"}`}
                  className="min-h-[44px] flex-row items-center gap-3 active:opacity-70"
                >
                  <Text className="text-3xl">{item.emoji}</Text>
                  <View className="flex-1">
                    <Text className="font-sans-bold text-base text-ink">{item.name}</Text>
                    <Text className="font-sans text-sm text-muted">
                      {item.count.toLocaleString("es-CL")} {item.count === 1 ? "producto" : "productos"}
                    </Text>
                  </View>
                  <Text className="font-sans-bold text-lg text-muted">›</Text>
                </Pressable>
                {aisles.length > 0 ? (
                  <View className="flex-row flex-wrap gap-2">
                    {aisles.slice(0, SHOWN_AISLES).map((a) => (
                      <Chip key={a.slug} label={a.name} onPress={() => open(item.slug, a.slug)} />
                    ))}
                    {more > 0 ? <Chip label={`+${more} más`} onPress={() => open(item.slug)} /> : null}
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
