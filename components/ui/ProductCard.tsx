import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { money } from "@/lib/format";
import { useTheme } from "@/theme/useTheme";
import type { ProductDTO } from "@/types/api";
import { ChainPill } from "./ChainPill";
import { LabelTile } from "./LabelTile";
import { PriceBlock } from "./PriceBlock";
import { SourceBadge, sourceLabel } from "./SourceBadge";

/**
 * Fila de resultados: foto o etiqueta, nombre, marca · formato, el precio más bajo (con su origen) y en qué
 * cadena, con su origen y su fecha (`cheapest.seen_at`: «visto hace…», o «recibido hace…» si llega por fuente asociada).
 */
export function ProductCard({ product, onPress }: { product: ProductDTO; onPress: () => void }) {
  const { colors } = useTheme();
  const best = product.cheapest;
  const price = best?.price ?? product.min_price;
  const meta = [product.brand, product.size].filter(Boolean).join(" · ");
  const chains = product.chains;

  const spoken = [
    product.name,
    meta,
    price != null ? `desde ${money(price)}${best ? ` en ${best.chain}` : ""}` : "sin precios todavía",
    chains > 0 ? `${chains} ${chains === 1 ? "cadena" : "cadenas"}` : null,
    best ? sourceLabel(best.source) : null,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityHint="Abre la ficha del producto"
      onPress={onPress}
      className="flex-row gap-3 rounded-2xl border border-line bg-surface p-3 active:bg-surface-2"
    >
      <LabelTile product={product} imageUrl={product.image_url} size={84} />
      <View className="min-w-0 flex-1 gap-1">
        <Text numberOfLines={2} className="font-sans-bold text-base leading-5 text-ink">
          {product.name}
        </Text>
        {!!meta && (
          <Text numberOfLines={1} className="font-sans text-sm text-muted">
            {meta}
          </Text>
        )}
        {price != null ? (
          <>
            <View className="mt-1">
              <PriceBlock price={price} listPrice={best?.list_price} ppum={best?.ppum} ppumUnit={best?.ppum_unit} size="sm" />
            </View>
            {best && (
              <View className="mt-1 flex-row flex-wrap items-center gap-x-1.5 gap-y-1">
                <Text className="font-sans-medium text-xs text-muted">{chains > 1 ? "Más barato en" : "Solo en"}</Text>
                <ChainPill name={best.chain} color={best.chain_color} />
              </View>
            )}
            {best && (
              <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
                <SourceBadge source={best.source} seenAt={best.seen_at} exact={best.seen_at_exact} />
                {chains > 1 && <Text className="font-sans-medium text-xs text-muted">{`${chains} cadenas`}</Text>}
                {best.verified && (
                  <View className="flex-row items-center gap-0.5">
                    <Check size={13} strokeWidth={3} color={colors.save} />
                    <Text className="font-sans-bold text-xs text-save">Verificado</Text>
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <Text className="mt-1 font-sans-semibold text-sm text-muted">Sin precios todavía</Text>
        )}
      </View>
    </Pressable>
  );
}
