import { Camera, Check } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { km, money } from "@/lib/format";
import { useTheme } from "@/theme/useTheme";
import type { PriceDTO } from "@/types/api";
import { ChainPill } from "./ChainPill";
import { PriceBlock } from "./PriceBlock";
import { SourceBadge, sourceLabel } from "./SourceBadge";
import { Tag } from "./Tag";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Una cadena (o sucursal) en la comparación, como una etiqueta de góndola: su precio, de dónde sale y desde
 * cuándo, y cuán cerca está. `cheapest` la marca como la que gana (lima + fondo verde de ahorro).
 */
export function PriceRow({ entry, cheapest = false, onPress }: { entry: PriceDTO; cheapest?: boolean; onPress?: () => void }) {
  const { colors } = useTheme();
  const web = entry.source === "retailer_web" || entry.source === "partner";
  const community = entry.source === "community";
  const online = entry.store.kind === "online";

  // "Líder Maipú · Maipú" repite la comuna: solo se añade cuando el nombre de la tienda no la trae
  const { name, commune } = entry.store;
  const repeats = !!commune && name.toLowerCase().includes(commune.toLowerCase());
  const place = online ? "Tienda en línea" : [name, repeats ? "" : commune].filter(Boolean).join(" · ");
  // Un precio web es el de la zona base de la cadena; si hay ubicación, se dice cuál es su sucursal más cercana.
  const near =
    entry.distance_km != null
      ? web && entry.nearest_branch
        ? `Tu ${entry.chain.name} más cercano: ${entry.nearest_branch.name}, a ${km(entry.distance_km)}`
        : `A ${km(entry.distance_km)}`
      : null;
  const listing = web && entry.listing_name ? `En ${entry.chain.name}: “${entry.listing_name}”` : null;
  // El texto de la promoción solo cuando no hay fecha (con fecha, PriceBlock dice "vence…"); "Oferta" a secas ya lo dice PriceBlock.
  const promo = entry.promo_text && !entry.promo_ends_at && !/^oferta\.?$/i.test(entry.promo_text.trim()) ? entry.promo_text : null;
  const verified = entry.verified_at !== null;

  const spoken = [
    `${entry.chain.name}, ${place}`,
    cheapest ? "el más barato" : null,
    money(entry.price),
    sourceLabel(entry.source),
    community ? plural(entry.confirmations, "confirmación", "confirmaciones") : null,
    near,
  ]
    .filter(Boolean)
    .join(". ");

  const body: ReactNode = (
    <>
      <View className="flex-row items-start gap-3">
        <View className="min-w-0 flex-1 gap-1.5">
          {cheapest && (
            <View className="flex-row items-center gap-1 self-start rounded-md bg-accent px-1.5 py-0.5">
              <Check size={13} strokeWidth={3} color={colors.accentInk} />
              <Text className="font-sans-bold text-xs leading-4 text-accent-ink">Más barato</Text>
            </View>
          )}
          <ChainPill name={entry.chain.name} color={entry.chain.color} />
          <Text numberOfLines={2} className="font-sans-semibold text-sm text-ink">
            {place}
          </Text>
          {near && <Text className="font-sans text-xs leading-4 text-ink">{near}</Text>}
          {listing && (
            <Text numberOfLines={2} className="font-sans text-xs leading-4 text-muted">
              {listing}
            </Text>
          )}
          {promo && <Tag>{promo}</Tag>}
        </View>
        <PriceBlock
          price={entry.price}
          listPrice={entry.list_price}
          ppum={entry.ppum}
          ppumUnit={entry.ppum_unit}
          promoEndsAt={entry.promo_ends_at}
          size="sm"
          align="right"
        />
      </View>
      <View className="mt-3 gap-1.5 border-t border-ink/10 pt-3">
        <SourceBadge source={entry.source} seenAt={entry.seen_at} exact={entry.seen_at_exact} />
        {community && (
          <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
            {verified && (
              <View className="flex-row items-center gap-0.5">
                <Check size={13} strokeWidth={3} color={colors.save} />
                <Text className="font-sans-bold text-xs text-save">Verificado</Text>
              </View>
            )}
            <Text className="font-sans text-xs text-muted">
              {entry.confirmations > 0 ? plural(entry.confirmations, "confirmación", "confirmaciones") : "Sin confirmaciones todavía"}
            </Text>
            {entry.disputes > 0 && (
              <Text className="font-sans text-xs text-muted">{`${plural(entry.disputes, "persona lo marca", "personas lo marcan")} desactualizado`}</Text>
            )}
            {entry.photo_url && (
              <View className="flex-row items-center gap-1">
                <Camera size={13} color={colors.muted} />
                <Text className="font-sans text-xs text-muted">Con foto</Text>
              </View>
            )}
            {entry.author && <Text className="font-sans text-xs text-muted">{`por ${entry.author}`}</Text>}
          </View>
        )}
      </View>
    </>
  );

  const box = `rounded-2xl border p-4 ${cheapest ? "border-primary bg-save-bg" : "border-line bg-surface"}`;

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={spoken} className={box}>
        {body}
      </View>
    );
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={spoken} accessibilityHint="Abre el detalle de este precio" onPress={onPress} className={`${box} active:opacity-80`}>
      {body}
    </Pressable>
  );
}
