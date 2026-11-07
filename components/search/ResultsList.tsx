import { useCallback, useState, type ReactElement } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { Button, EmptyState, ErrorState, LoadingList, Notice, ProductCard } from "@/components/ui";
import type { SearchFilters } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { useSearch } from "@/lib/api/queries";
import { useTheme } from "@/theme/useTheme";
import type { ProductDTO } from "@/types/api";

type Props = {
  filters: SearchFilters;
  /** Con `false` no se consulta (p. ej. el texto aún es muy corto). */
  enabled?: boolean;
  onOpenProduct: (slug: string) => void;
  /** Si hay filtros activos, "Quitar los filtros" aparece en el estado vacío. */
  onClearFilters?: () => void;
  header?: ReactElement | null;
};

const keyOf = (p: ProductDTO) => p.slug;

/**
 * Resultados de búsqueda con scroll infinito: las cuatro pantallas de cualquier lista que carga datos
 * (cargando, error con reintento, vacío, contenido). Una página que falla al refrescar deja la lista y avisa.
 */
export function ResultsList({ filters, enabled = true, onOpenProduct, onClearFilters, header = null }: Props) {
  const { colors } = useTheme();
  const search = useSearch(filters, enabled);
  const { data, isPending, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError } = search;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: ProductDTO }) => <ProductCard product={item} onPress={() => onOpenProduct(item.slug)} />,
    [onOpenProduct],
  );

  if (!data) {
    return (
      <View className="flex-1">
        {header}
        {isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        ) : isPending && enabled ? (
          <LoadingList />
        ) : null}
      </View>
    );
  }

  const { items, total } = data;
  const dimmed = search.isPlaceholderData; // todavía son los resultados de la búsqueda anterior

  return (
    <FlatList
      data={items}
      keyExtractor={keyOf}
      renderItem={renderItem}
      style={{ opacity: dimmed ? 0.55 : 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 12 }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
      }}
      onEndReachedThreshold={0.6}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.muted} />}
      ListHeaderComponent={
        <View className="gap-3 pb-1">
          {header}
          {isError && !isFetchNextPageError ? (
            <Notice tone="warn">No pudimos actualizar la lista. Te mostramos lo último que cargó.</Notice>
          ) : null}
          {items.length > 0 ? (
            <Text accessibilityRole="header" className="font-sans-semibold text-sm text-muted">
              {total.toLocaleString("es-CL")} {total === 1 ? "producto" : "productos"}
            </Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View>
          <EmptyState
            title={onClearFilters ? "Nada con estos filtros" : "No encontramos ese producto"}
            hint={
              onClearFilters
                ? "Prueba quitando alguno: puede que esa cadena no lo venda o que no esté en oferta."
                : "Prueba con otra palabra o escanea el código de barras del envase."
            }
          />
          {onClearFilters ? (
            <View className="items-center pt-2">
              <Button title="Quitar los filtros" variant="secondary" onPress={onClearFilters} />
            </View>
          ) : null}
        </View>
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="items-center py-4" accessibilityLabel="Cargando más productos">
            <ActivityIndicator color={colors.muted} />
          </View>
        ) : isFetchNextPageError ? (
          <View className="items-center gap-2 py-4">
            <Text className="font-sans text-sm text-muted">No pudimos cargar más productos.</Text>
            <Button title="Reintentar" variant="secondary" onPress={() => void fetchNextPage()} />
          </View>
        ) : null
      }
    />
  );
}
