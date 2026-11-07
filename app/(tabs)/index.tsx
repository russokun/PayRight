import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ResultsList } from "@/components/search/ResultsList";
import { Button, ErrorState, Notice, SearchField } from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { errorMessage } from "@/lib/api/errors";
import { useCategories, useMeta } from "@/lib/api/queries";
import { useTheme } from "@/theme/useTheme";
import type { DepartmentDTO } from "@/types/api";

function DepartmentTile({ dept, onPress }: { dept: DepartmentDTO; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${dept.name}, ${dept.count} ${dept.count === 1 ? "producto" : "productos"}`}
      className="min-h-[96px] flex-1 justify-between gap-3 rounded-2xl border border-line bg-surface p-4 active:opacity-70"
    >
      <Text className="text-3xl">{dept.emoji}</Text>
      <View>
        <Text className="font-sans-bold text-base leading-5 text-ink">{dept.name}</Text>
        <Text className="font-sans text-sm text-muted">
          {dept.count.toLocaleString("es-CL")} {dept.count === 1 ? "producto" : "productos"}
        </Text>
      </View>
    </Pressable>
  );
}

/** Inicio: el buscador primero. Con texto muestra resultados en línea; sin texto, los departamentos. */
export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const meta = useMeta();
  const categories = useCategories();
  const [text, setText] = useState("");
  const query = useDebouncedValue(text.trim(), 300);
  const searching = query.length >= 2;

  const openProduct = useCallback(
    (slug: string) => router.push({ pathname: "/producto/[slug]", params: { slug } }),
    [router],
  );
  const openDepartment = useCallback(
    (category: string) => router.push({ pathname: "/buscar", params: { category } }),
    [router],
  );

  const demo = meta.data?.is_demo ? (
    <View className="px-4 pb-3">
      <Notice tone="demo">Datos de demostración: los precios que ves son de ejemplo, no de las tiendas.</Notice>
    </View>
  ) : null;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top + 8 }}>
      <View className="gap-3 px-4 pb-3">
        <Text accessibilityRole="header" className="font-display-extrabold text-3xl leading-9 text-ink">
          ¿Dónde está más barato?
        </Text>
        <SearchField
          value={text}
          onChangeText={setText}
          onSubmit={() => {
            const q = text.trim();
            if (q) router.push({ pathname: "/buscar", params: { q } });
          }}
          onScanPress={() => router.push("/escanear")}
          placeholder="¿Qué producto buscas?"
        />
      </View>

      {searching ? (
        <ResultsList
          filters={{ q: query }}
          onOpenProduct={openProduct}
          header={demo}
        />
      ) : (
        <FlatList
          data={categories.data ?? []}
          keyExtractor={(d) => d.slug}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 12, paddingBottom: insets.bottom + 24 }}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <DepartmentTile dept={item} onPress={() => openDepartment(item.slug)} />}
          ListHeaderComponent={
            <View className="gap-3">
              {demo}
              <View className="flex-row items-center gap-3 px-4">
                <View className="flex-1">
                  <Button
                    title="Ofertas"
                    variant="primary"
                    onPress={() => router.push({ pathname: "/buscar", params: { offers: "1" } })}
                    accessibilityLabel="Ver los productos en oferta"
                  />
                </View>
                <View className="flex-1">
                  <Button
                    title="Todas las categorías"
                    variant="secondary"
                    onPress={() => router.push("/categorias")}
                    accessibilityLabel="Ver todas las categorías"
                  />
                </View>
              </View>
              <Text accessibilityRole="header" className="px-4 pt-2 font-display-extrabold text-xl text-ink">
                Departamentos
              </Text>
            </View>
          }
          ListEmptyComponent={
            categories.isError ? (
              <ErrorState message={errorMessage(categories.error)} onRetry={() => categories.refetch()} />
            ) : categories.isPending ? (
              <View className="items-center py-10" accessibilityLabel="Cargando departamentos">
                <ActivityIndicator color={colors.muted} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
