import { Text, View } from 'react-native';
import { Button, ChainPill, PriceBlock, SourceBadge } from '@/components/ui';
import { money } from '@/lib/format';
import { openExternal } from '@/lib/open-external';
import { savings } from '@/lib/product-view';
import type { PriceDTO } from '@/types/api';

/**
 * La respuesta primero: dónde está más barato, a cuánto y de dónde sale ese precio (origen y fecha).
 * El ahorro solo se calcula si las cadenas parecen vender lo mismo (`mayDiffer = false`).
 */
export function Verdict({
  prices,
  mayDiffer,
}: {
  prices: PriceDTO[];
  mayDiffer: boolean;
}) {
  const cheapest = prices[0];
  const saved = mayDiffer ? null : savings(prices);
  return (
    <View className="gap-3 rounded-3xl border border-line bg-surface p-5">
      <Text className="font-sans-semibold text-sm text-muted">
        {prices.length > 1 ? 'Más barato en' : 'Precio en'}
      </Text>
      <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
        <ChainPill name={cheapest.chain.name} color={cheapest.chain.color} />
        {cheapest.store.kind === 'physical' ? (
          <Text className="font-sans-semibold text-sm text-muted">
            {cheapest.store.name}
          </Text>
        ) : null}
      </View>
      <PriceBlock
        size="lg"
        price={cheapest.price}
        listPrice={cheapest.list_price}
        ppum={cheapest.ppum}
        ppumUnit={cheapest.ppum_unit}
        promoEndsAt={cheapest.promo_ends_at}
      />
      <SourceBadge
        source={cheapest.source}
        seenAt={cheapest.seen_at}
        exact={cheapest.seen_at_exact}
      />
      {saved ? (
        <Text className="font-sans-bold text-sm text-save">
          Ahorras {money(saved.amount)} ({saved.percent}%) frente a{' '}
          {saved.against.chain.name}
        </Text>
      ) : mayDiffer && prices.length > 1 ? (
        <Text className="font-sans text-sm text-muted">
          No calculamos el ahorro: las cadenas parecen vender variantes
          distintas.
        </Text>
      ) : null}
      {cheapest.source_url ? (
        <View className="items-start">
          <Button
            title={`Ver en ${cheapest.chain.name}`}
            onPress={() => openExternal(cheapest.source_url!)}
            accessibilityLabel={`Ver este producto en el sitio de ${cheapest.chain.name}`}
          />
        </View>
      ) : null}
    </View>
  );
}
