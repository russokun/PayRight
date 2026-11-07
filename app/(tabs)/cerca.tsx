import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationBar } from '@/components/location/LocationBar';
import { NearbyRow } from '@/components/location/NearbyRow';
import { StoresSection } from '@/components/location/StoresSection';
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  LoadingList,
  Notice,
} from '@/components/ui';
import { errorMessage } from '@/lib/api/errors';
import { useMeta } from '@/lib/api/queries';
import {
  DEFAULT_RADIUS_KM,
  RADII_KM,
  useNearby,
  useStores,
} from '@/lib/api/places-queries';
import { useAdoptPlace } from '@/lib/location/use-adopt-place';
import { useApiLocation } from '@/store/useLocationStore';
import { useTheme } from '@/theme/useTheme';
import type { NearbyDTO } from '@/types/api';

const keyOf = (n: NearbyDTO) =>
  `${n.product.slug}|${n.chain.name}|${n.store_name}`;

/** Sin ubicación no hay «cerca»: se explica y se lleva a elegirla. */
function NoLocation({ onChoose }: { onChoose: () => void }) {
  const { colors } = useTheme();
  return (
    <View className="items-center gap-4 rounded-2xl border border-dashed border-line px-6 py-10">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-2">
        <MapPin size={24} color={colors.muted} />
      </View>
      <Text
        accessibilityRole="header"
        className="text-center font-display-extrabold text-lg text-ink"
      >
        Elige dónde estás
      </Text>
      <Text className="text-center font-sans text-sm leading-5 text-muted">
        Con tu ubicación o tu comuna te mostramos los mejores precios y los
        supermercados más cercanos. Se guarda solo en tu teléfono.
      </Text>
      <Button title="Elegir mi ubicación" onPress={onChoose} />
    </View>
  );
}

/**
 * Cerca: los mejores precios en un radio de 2, 5 o 10 km y los supermercados más cercanos, con tu GPS o tu comuna.
 * Una sola lista (FlatList) con encabezado y pie, para que todo se desplace junto y las filas se virtualicen.
 */
export default function NearScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const location = useApiLocation();
  const meta = useMeta();
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS_KM);
  const nearby = useNearby(location, radius);
  const stores = useStores(location);
  const [refreshing, setRefreshing] = useState(false);

  // el nombre del lugar lo calcula la API; si el GPS aún no lo tenía, se guarda
  useAdoptPlace(nearby.data?.meta.location ?? stores.data?.meta.location);

  const chooseLocation = useCallback(() => router.push('/ubicacion'), [router]);
  const openProduct = useCallback(
    (slug: string) =>
      router.push({ pathname: '/producto/[slug]', params: { slug } }),
    [router],
  );
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([nearby.refetch(), stores.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [nearby, stores]);

  const title = (
    <Text
      accessibilityRole="header"
      className="font-display-extrabold text-3xl text-ink"
    >
      Cerca de ti
    </Text>
  );

  if (!location) {
    return (
      <View
        className="flex-1 gap-4 bg-bg px-4"
        style={{ paddingTop: insets.top + 12 }}
      >
        {title}
        <NoLocation onChoose={chooseLocation} />
      </View>
    );
  }

  const items = nearby.data?.items ?? [];
  const dimmed = nearby.isPlaceholderData; // todavía son los resultados del radio o la ubicación anterior
  const nextRadius = RADII_KM.find((r) => r > radius);

  const header = (
    <View className="gap-4 pb-1">
      {title}
      {meta.data?.is_demo ? (
        <Notice tone="demo">
          Datos de demostración: los precios que ves son de ejemplo, no de las
          tiendas.
        </Notice>
      ) : null}
      <LocationBar />
      <View className="gap-2">
        <Text className="font-sans-semibold text-sm text-muted">
          Radio de búsqueda
        </Text>
        <View
          accessibilityRole="radiogroup"
          className="flex-row flex-wrap gap-2"
        >
          {RADII_KM.map((r) => (
            <Chip
              key={r}
              label={`${r} km`}
              selected={r === radius}
              onPress={() => setRadius(r)}
            />
          ))}
        </View>
      </View>
      <View className="gap-1 pt-2">
        <Text
          accessibilityRole="header"
          className="font-display-extrabold text-xl text-ink"
        >
          Mejores precios cerca de ti
        </Text>
        <Text className="font-sans text-sm leading-5 text-muted">
          {`Productos con precio dentro de ${radius} km. Cada uno muestra la tienda, la distancia y de dónde sale el precio.`}
        </Text>
      </View>
      {nearby.isError && nearby.data ? (
        <Notice tone="warn">
          No pudimos actualizar los precios. Te mostramos lo último que cargó.
        </Notice>
      ) : null}
    </View>
  );

  const empty = nearby.isError ? (
    <ErrorState
      message={errorMessage(nearby.error)}
      onRetry={() => nearby.refetch()}
    />
  ) : nearby.isPending ? (
    <LoadingList count={3} />
  ) : (
    <View className="gap-3">
      <EmptyState
        title={`Sin precios en ${radius} km`}
        hint="Prueba con un radio mayor, o cambia tu ubicación."
      />
      {nextRadius ? (
        <View className="items-center">
          <Button
            title={`Probar con ${nextRadius} km`}
            variant="secondary"
            onPress={() => setRadius(nextRadius)}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <FlatList
      data={items}
      keyExtractor={keyOf}
      renderItem={({ item }) => (
        <View style={{ opacity: dimmed ? 0.55 : 1 }}>
          <NearbyRow item={item} onPress={openProduct} />
        </View>
      )}
      className="flex-1 bg-bg"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: insets.top + 12,
        paddingBottom: 32,
        gap: 12,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.muted}
        />
      }
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={<StoresSection query={stores} at={location} />}
    />
  );
}
