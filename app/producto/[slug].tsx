import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Text, View } from 'react-native';
import { ListingDetails } from '@/components/product/ListingDetails';
import { TrendSection } from '@/components/product/TrendSection';
import { Verdict } from '@/components/product/Verdict';
import {
  Button,
  EmptyState,
  ErrorState,
  LabelTile,
  LoadingList,
  Notice,
  PriceRow,
} from '@/components/ui';
import { errorMessage, isNotFound } from '@/lib/api/errors';
import { useMeta, useProduct } from '@/lib/api/queries';
import { timeAgo } from '@/lib/format';
import { openExternal } from '@/lib/open-external';
import { comparisonNotices, hasWebPrices } from '@/lib/product-view';
import { useTheme } from '@/theme/useTheme';
import type { PriceDTO } from '@/types/api';

const keyOf = (p: PriceDTO) => String(p.id);

/** Ficha: la respuesta primero (dónde conviene), luego cada precio con su origen y fecha, el detalle y la tendencia. */
export default function ProductScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const product = useProduct(slug ?? '');
  const meta = useMeta();

  const renderPrice = useCallback(
    ({ item, index }: { item: PriceDTO; index: number }) => (
      <PriceRow
        entry={item}
        cheapest={index === 0}
        onPress={
          item.source_url
            ? () => void openExternal(item.source_url!)
            : undefined
        }
      />
    ),
    [],
  );

  const screenOptions = (title: string) => (
    <Stack.Screen
      options={{
        headerShown: true,
        title,
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerTitleStyle: { color: colors.ink },
      }}
    />
  );

  if (!product.data) {
    return (
      <View className="flex-1 bg-bg">
        {screenOptions('Producto')}
        <View className="px-4 pt-2">
          {product.isError ? (
            isNotFound(product.error) ? (
              <View className="gap-2">
                <EmptyState
                  title="No encontramos este producto"
                  hint="Puede que ya no exista o que el enlace esté incompleto."
                />
                <View className="items-center">
                  <Button
                    title="Ir al inicio"
                    variant="secondary"
                    onPress={() => router.replace('/')}
                  />
                </View>
              </View>
            ) : (
              <ErrorState
                message={errorMessage(product.error)}
                onRetry={() => product.refetch()}
              />
            )
          ) : (
            <LoadingList count={3} />
          )}
        </View>
      </View>
    );
  }

  const { product: p, prices, comparison, checked_at } = product.data;
  const notices = comparisonNotices(comparison);
  const web = hasWebPrices(prices);
  const category = meta.data?.categories.find((c) => c.slug === p.category);
  const readsWeb = new Map(
    (meta.data?.chains ?? []).map((c) => [c.slug, c.reads_web]),
  );
  // precio web de una cadena que PayRight no lee directamente (llega de otra fuente): referencial
  const referential = [
    ...new Set(
      prices
        .filter(
          (e) =>
            e.source === 'partner' ||
            (e.source === 'retailer_web' &&
              readsWeb.get(e.chain.slug) === false),
        )
        .map((e) => e.chain.name),
    ),
  ];

  const header = (
    <View className="gap-4 pb-2">
      <View className="flex-row items-start gap-4">
        <LabelTile product={p} imageUrl={p.image_url} size={96} />
        <View className="flex-1 gap-1">
          <Text
            accessibilityRole="header"
            className="font-display-extrabold text-2xl leading-7 text-ink"
          >
            {p.name}
          </Text>
          <Text className="font-sans-semibold text-base text-muted">
            {[p.brand, p.size].filter((x) => x && x !== 'Granel').join(' · ')}
          </Text>
          {category ? (
            <Text className="font-sans text-sm text-muted">{`${category.emoji} ${category.name}`}</Text>
          ) : null}
          {notices.singleGtin ? (
            <Text selectable className="font-sans text-xs text-muted">
              Código de barras {notices.singleGtin}
            </Text>
          ) : null}
        </View>
      </View>

      {meta.data?.is_demo ? (
        <Notice tone="demo">
          Datos de demostración: los precios que ves son de ejemplo, no de las
          tiendas.
        </Notice>
      ) : null}
      {notices.mayDiffer ? (
        <Notice tone="warn">
          Puede no ser idéntico: las tiendas describen este producto distinto y
          podrían ser variantes o formatos diferentes. Mira cada ficha antes de
          comparar.
        </Notice>
      ) : null}
      {notices.sameBarcode ? (
        <Notice tone="info">
          Mismo código de barras en las tiendas
          {comparison.gtin ? ` · ${comparison.gtin}` : ''}
        </Notice>
      ) : null}
      {notices.differentBarcodes && !notices.mayDiffer ? (
        <Notice tone="warn">
          Las tiendas publican códigos de barras distintos para este producto.
        </Notice>
      ) : null}

      {prices.length > 0 ? (
        <>
          <Verdict prices={prices} mayDiffer={notices.mayDiffer} />
          <View className="gap-1 pt-2">
            <Text
              accessibilityRole="header"
              className="font-display-extrabold text-xl text-ink"
            >
              Precio en cada supermercado
            </Text>
            <Text className="font-sans text-sm text-muted">
              Del más barato al más caro.
              {web
                ? ' Son los precios que cada cadena publica en su web para una zona base: en tu sucursal pueden variar.'
                : ''}
            </Text>
            {web ? (
              <Text className="font-sans-semibold text-sm text-ink">
                {checked_at
                  ? `Precios web verificados ${timeAgo(checked_at)}`
                  : 'Precios web sin verificar en vivo'}
              </Text>
            ) : null}
          </View>
          {referential.length > 0 ? (
            <Notice tone="info">
              Precio web · referencial: {referential.join(', ')}{' '}
              {referential.length > 1 ? 'lo publican' : 'lo publica'} en su web,
              pero PayRight no lo lee directamente de su sitio. Confírmalo en la
              tienda.
            </Notice>
          ) : null}
        </>
      ) : null}
    </View>
  );

  return (
    <View className="flex-1 bg-bg">
      {screenOptions('Producto')}
      <FlatList
        data={prices}
        keyExtractor={keyOf}
        renderItem={renderPrice}
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 12 }}
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            title="Aún no hay precios vigentes de este producto"
            hint="Cuando alguien suba uno o una cadena lo publique, aparecerá aquí con su origen y su fecha."
          />
        }
        ListFooterComponent={
          <View className="gap-6 pt-6">
            <ListingDetails
              slug={p.slug}
              contentOff={meta.data?.retailer_content === false}
            />
            <TrendSection slug={p.slug} />
          </View>
        }
      />
    </View>
  );
}
