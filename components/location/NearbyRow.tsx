import { Check } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  ChainPill,
  LabelTile,
  PriceBlock,
  SourceBadge,
  sourceLabel,
  Tag,
} from '@/components/ui';
import { km, money } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';
import type { NearbyDTO } from '@/types/api';

/**
 * Una fila de «Mejores precios cerca de ti»: el producto, su precio más barato dentro del radio, en qué cadena y
 * qué local (con distancia), de dónde sale el precio y desde cuándo. Un precio web (`via_web`) es el de la cadena
 * entera: se dice que el local es solo su sucursal más cercana, no que ahí esté a ese precio en góndola.
 */
export const NearbyRow = memo(function NearbyRow({
  item,
  onPress,
}: {
  item: NearbyDTO;
  onPress: (slug: string) => void;
}) {
  const { colors } = useTheme();
  const { product } = item;
  const meta = [product.brand, product.size]
    .filter((x) => x && x !== 'Granel')
    .join(' · ');
  const where = `${item.store_name} · a ${km(item.distance_km)}`;
  const saving = item.saving_pct >= 1 ? Math.round(item.saving_pct) : 0;

  const spoken = [
    product.name,
    meta,
    `${money(item.price)} en ${item.chain.name}`,
    where,
    item.via_web ? 'Precio web de la cadena, sucursal más cercana' : null,
    saving ? `${saving} por ciento menos que el más caro` : null,
    sourceLabel(item.source),
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityHint="Abre la ficha del producto"
      onPress={() => onPress(product.slug)}
      className="flex-row gap-3 rounded-2xl border border-line bg-surface p-3 active:bg-surface-2"
    >
      <LabelTile product={product} imageUrl={product.image_url} size={84} />
      <View className="min-w-0 flex-1 gap-1">
        <Text
          numberOfLines={2}
          className="font-sans-bold text-base leading-5 text-ink"
        >
          {product.name}
        </Text>
        {!!meta && (
          <Text numberOfLines={1} className="font-sans text-sm text-muted">
            {meta}
          </Text>
        )}
        <View className="mt-1">
          <PriceBlock
            price={item.price}
            listPrice={item.list_price}
            ppum={item.ppum}
            ppumUnit={item.ppum_unit}
            size="sm"
          />
        </View>
        <View className="mt-1 flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <ChainPill name={item.chain.name} color={item.chain.color} />
          {saving > 0 && <Tag>{`${saving}% menos que el más caro`}</Tag>}
        </View>
        <Text className="font-sans-medium text-xs leading-4 text-ink">
          {where}
        </Text>
        {item.via_web && (
          <Text className="font-sans text-xs leading-4 text-muted">
            Precio web de la cadena, sucursal más cercana
          </Text>
        )}
        {/* en columna: SourceBadge parte la línea sola; dentro de otra fila con wrap su fecha se salía de la tarjeta */}
        <View className="gap-1">
          <SourceBadge
            source={item.source}
            seenAt={item.seen_at}
            exact={item.seen_at_exact}
          />
          {item.verified && (
            <View className="flex-row items-center gap-0.5 self-start">
              <Check size={13} strokeWidth={3} color={colors.save} />
              <Text className="font-sans-bold text-xs text-save">
                Verificado
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});
