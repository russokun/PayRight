import { Text, View } from 'react-native';
import { Button, ChainPill, ErrorState, LoadingList, Notice, Tag } from '@/components/ui';
import { errorMessage } from '@/lib/api/errors';
import { absentLabel, chainNote, coverageLabel, productsCount, standing, standingLabel } from '@/lib/cart/quote-view';
import { km, money } from '@/lib/format';
import { tabularNums } from '@/theme/typography';
import type { QuoteChainDTO, QuoteDTO } from '@/types/api';

type Props = {
  quote: QuoteDTO | undefined;
  /** La cotización mostrada es la del carrito anterior; llega la nueva. */
  stale: boolean;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
};

function ChainRow({ quote, chain, index }: { quote: QuoteDTO; chain: QuoteChainDTO; index: number }) {
  const place = standing(quote, chain, index);
  const winner = place !== null;
  const placeLabel = standingLabel(place);
  const note = chainNote(quote, chain, index);
  const coverage = coverageLabel(chain, productsCount(quote));
  const where = chain.distance_km != null ? ` · a ${km(chain.distance_km)}` : '';
  const spoken = `${chain.complete ? `${index + 1}. ` : ''}${chain.name}. ${coverage}${where}. Total ${money(chain.total)}. ${note}`;
  return (
    <View
      accessible
      accessibilityLabel={spoken}
      className={`flex-row items-center gap-3 rounded-2xl border p-3 ${winner ? 'border-primary bg-save-bg' : 'border-line bg-surface'}`}
    >
      {/* sin número para una cadena incompleta: su total parcial no entra en el ranking */}
      <Text className="w-5 text-center font-sans-bold text-sm text-muted" style={tabularNums}>
        {chain.complete ? index + 1 : ''}
      </Text>
      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row flex-wrap items-center gap-2">
          <ChainPill name={chain.name} color={chain.color} />
          {placeLabel && <Tag>{placeLabel}</Tag>}
        </View>
        <Text className="font-sans-medium text-xs text-muted">
          {coverage}
          {where}
        </Text>
      </View>
      <View className="items-end">
        <Text className="font-display-extrabold text-xl text-ink" style={tabularNums}>
          {money(chain.total)}
        </Text>
        <Text className="font-sans-semibold text-xs text-muted" style={tabularNums}>
          {note}
        </Text>
      </View>
    </View>
  );
}

/** «Cuánto cuesta en cada cadena»: de la más barata a la más cara, con cuánto de tu lista tiene cada una. */
export function QuoteSummary({ quote, stale, loading, error, onRetry }: Props) {
  let body;
  if (!quote) {
    body = error ? <ErrorState message={errorMessage(error)} onRetry={onRetry} /> : loading ? <LoadingList count={2} /> : null;
  } else if (quote.chains.length === 0) {
    body = (
      <Notice tone="info">
        Todavía no hay precios para los productos de tu lista. Cuando una cadena o alguien de la comunidad suba uno,
        aparecerá aquí.
      </Notice>
    );
  } else {
    const partial = quote.chains.some((c) => !c.complete);
    const absent = absentLabel(quote.absent);
    body = (
      <View className="gap-2">
        {error ? (
          <View className="gap-2">
            <Notice tone="warn">No pudimos actualizar la cotización: estos totales pueden no ser los de ahora.</Notice>
            <View className="items-start">
              <Button title="Reintentar" variant="secondary" onPress={onRetry} />
            </View>
          </View>
        ) : null}
        <View className="gap-2" style={stale ? { opacity: 0.55 } : undefined} accessibilityElementsHidden={stale}>
          {quote.chains.map((c, i) => (
            <ChainRow key={c.slug} quote={quote} chain={c} index={i} />
          ))}
        </View>
        {stale && (
          <Text accessibilityLiveRegion="polite" className="font-sans-semibold text-sm text-muted">
            Actualizando los totales…
          </Text>
        )}
        {partial && (
          <Text className="font-sans text-xs leading-4 text-muted">
            Un total parcial no incluye los productos que esa cadena no tiene: no se compara con los demás.
          </Text>
        )}
        {absent && <Text className="font-sans text-xs leading-4 text-muted">{absent}</Text>}
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text accessibilityRole="header" className="font-display-extrabold text-xl text-ink">
          Cuánto cuesta en cada cadena
        </Text>
        <Text className="font-sans text-sm text-muted">Del más barato al más caro, con tu lista tal como está.</Text>
      </View>
      {body}
    </View>
  );
}
