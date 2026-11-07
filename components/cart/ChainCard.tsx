import { Check, ChevronDown, ChevronUp, Navigation } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GoButton } from '@/components/product/GoButton';
import { Button, ChainPill, SourceTag, Tag, sourceLabel } from '@/components/ui';
import { chainNote, coverageLabel, missingLabel, missingNames, productsCount, standing, standingLabel } from '@/lib/cart/quote-view';
import { km, money } from '@/lib/format';
import { openDirections } from '@/lib/maps';
import { openExternal } from '@/lib/open-external';
import { tabularNums } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';
import type { QuoteChainDTO, QuoteDTO } from '@/types/api';

type Props = {
  quote: QuoteDTO;
  chain: QuoteChainDTO;
  index: number;
  expanded: boolean;
  onToggle: (slug: string) => void;
};

/** «Sucursal»: dónde queda lo más barato de la lista en esta cadena, o que es su tienda en línea. */
function Where({ chain }: { chain: QuoteChainDTO }) {
  const { colors } = useTheme();
  const store = chain.store;
  if (!store) {
    return <Text className="font-sans text-sm text-muted">Tienda en línea de {chain.name}</Text>;
  }
  const place = [store.name, store.commune].filter(Boolean).join(' · ');
  return (
    <View className="gap-2">
      <View className="gap-0.5">
        <Text className="font-sans-semibold text-sm text-ink">{place}</Text>
        {!!store.address && <Text className="font-sans text-sm text-muted">{store.address}</Text>}
        {chain.distance_km != null && <Text className="font-sans text-sm text-muted">{`A ${km(chain.distance_km)}`}</Text>}
      </View>
      <View className="items-start">
        <Button
          title="Cómo llegar"
          variant="secondary"
          accessibilityLabel={`Cómo llegar a ${store.name}`}
          icon={<Navigation size={18} color={colors.ink} />}
          onPress={() => void openDirections({ lat: store.lat, lng: store.lng, name: store.name })}
        />
      </View>
    </View>
  );
}

/** Una cadena en la cotización: total, cuánto tiene de tu lista y, al tocarla, cada producto con su precio y su origen. */
export const ChainCard = memo(function ChainCard({ quote, chain, index, expanded, onToggle }: Props) {
  const { colors } = useTheme();
  const total = productsCount(quote);
  const place = standing(quote, chain, index);
  const winner = place !== null;
  const placeLabel = standingLabel(place);
  const note = chainNote(quote, chain, index);
  const coverage = coverageLabel(chain, total);
  const missing = missingLabel(missingNames(chain, quote.items));
  const Chevron = expanded ? ChevronUp : ChevronDown;

  const spoken = [
    chain.complete ? `${index + 1}. ${chain.name}` : chain.name,
    placeLabel ? placeLabel.toLowerCase() : null,
    coverage,
    chain.distance_km != null ? `a ${km(chain.distance_km)}` : null,
    `total ${money(chain.total)}`,
    note,
    missing,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <View className={`overflow-hidden rounded-2xl border ${winner ? 'border-primary bg-save-bg' : 'border-line bg-surface'}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={spoken}
        accessibilityHint={expanded ? 'Oculta los productos' : 'Muestra cada producto con su precio'}
        accessibilityState={{ expanded }}
        onPress={() => onToggle(chain.slug)}
        className="flex-row items-start gap-3 p-4 active:opacity-80"
      >
        {/* sin número para una cadena incompleta: su total parcial no entra en el ranking */}
        <Text className="w-5 pt-0.5 text-center font-sans-bold text-sm text-muted" style={tabularNums}>
          {chain.complete ? index + 1 : ''}
        </Text>
        <View className="min-w-0 flex-1 gap-1.5">
          <View className="flex-row flex-wrap items-center gap-2">
            <ChainPill name={chain.name} color={chain.color} />
            {placeLabel && <Tag>{placeLabel}</Tag>}
          </View>
          <Text className="font-sans-medium text-sm text-muted">
            {coverage}
            {chain.distance_km != null ? ` · a ${km(chain.distance_km)}` : ''}
          </Text>
          {missing && <Text className="font-sans text-sm leading-5 text-ink">{missing}</Text>}
        </View>
        <View className="items-end gap-0.5">
          <Text className="font-display-extrabold text-2xl text-ink" style={tabularNums}>
            {money(chain.total)}
          </Text>
          <Text className="font-sans-semibold text-xs text-muted" style={tabularNums}>
            {note}
          </Text>
          <View className="pt-1">
            <Chevron size={18} color={colors.muted} />
          </View>
        </View>
      </Pressable>

      {expanded && (
        <View className="gap-4 border-t border-ink/10 p-4">
          <Where chain={chain} />
          <View className="gap-3">
            {quote.items.map((item, i) => {
              const divider = i > 0 ? 'border-t border-ink/10 pt-3' : '';
              const cell = chain.cells[item.slug];
              const label = `${item.name}${item.qty > 1 ? ` ×${item.qty}` : ''}`;
              if (!cell) {
                return (
                  <View key={item.slug} accessible accessibilityLabel={`${label}: ${chain.name} no tiene precio`} className={`flex-row items-center justify-between gap-3 ${divider}`}>
                    <Text numberOfLines={2} className="min-w-0 flex-1 font-sans text-sm text-muted">
                      {label}
                    </Text>
                    <Text className="font-sans-semibold text-sm text-muted">Sin precio</Text>
                  </View>
                );
              }
              return (
                <View key={item.slug} className={`gap-1.5 ${divider}`}>
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <Text numberOfLines={2} className="font-sans-semibold text-sm text-ink">
                        {label}
                      </Text>
                      {item.qty > 1 && (
                        <Text className="font-sans text-xs text-muted" style={tabularNums}>
                          {`${money(cell.unit_price)} cada uno`}
                        </Text>
                      )}
                    </View>
                    <Text
                      accessibilityLabel={`${money(cell.price)}, ${sourceLabel(cell.source)}${cell.verified ? ', verificado' : ''}`}
                      className="font-display-extrabold text-lg text-ink"
                      style={tabularNums}
                    >
                      {money(cell.price)}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap items-center gap-2">
                    <SourceTag source={cell.source} />
                    {cell.verified && (
                      <View className="flex-row items-center gap-0.5">
                        <Check size={13} strokeWidth={3} color={colors.save} />
                        <Text className="font-sans-bold text-xs text-save">Verificado</Text>
                      </View>
                    )}
                  </View>
                  {cell.can_go && (
                    <View className="items-start">
                      <GoButton slug={item.slug} chain={chain.slug} label={`Ir a ${chain.name}`} variant="secondary" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          <View className="flex-row items-baseline justify-between border-t border-ink/10 pt-3">
            <Text className="font-sans-bold text-sm text-ink">{chain.complete ? 'Total' : 'Total parcial'}</Text>
            <Text className="font-display-extrabold text-xl text-ink" style={tabularNums}>
              {money(chain.total)}
            </Text>
          </View>
          {!chain.complete && (
            <Text className="font-sans text-xs leading-4 text-muted">
              No incluye lo que {chain.name} no tiene: no se compara con las cadenas que tienen toda tu lista.
            </Text>
          )}
          {chain.site && (
            <View className="items-start">
              <Button title={`Abrir el sitio de ${chain.name}`} variant="secondary" onPress={() => void openExternal(chain.site!)} />
            </View>
          )}
        </View>
      )}
    </View>
  );
});
