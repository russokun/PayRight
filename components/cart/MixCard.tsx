import { Navigation } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Button, ChainPill, SourceTag } from '@/components/ui';
import { itemName, mixSummary, stopsLabel } from '@/lib/cart/quote-view';
import { money } from '@/lib/format';
import { openDirections } from '@/lib/maps';
import { tabularNums } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';
import type { QuoteDTO } from '@/types/api';

/**
 * «Ruta mixta»: lo más barato de cada producto, repartido en varias tiendas. El ahorro se mide contra la mejor opción
 * de un solo lugar y solo se afirma si esa tiene toda tu lista (si no, no es una comparación justa).
 */
export function MixCard({ quote }: { quote: QuoteDTO }) {
  const { colors } = useTheme();
  const summary = mixSummary(quote);
  const mix = quote.mix;
  if (!summary || !mix) return null;

  return (
    <View className="gap-4 rounded-3xl border border-line bg-surface p-5">
      <View className="gap-1">
        <Text accessibilityRole="header" className="font-sans-bold text-xs uppercase tracking-widest text-save">
          Ruta mixta · {stopsLabel(summary.stops)}
        </Text>
        <Text className="font-display-extrabold text-4xl text-ink" style={tabularNums}>
          {money(mix.total)}
        </Text>
        {summary.saving && <Text className="font-sans-bold text-sm leading-5 text-save">{summary.saving}</Text>}
        {summary.note && <Text className="font-sans text-sm leading-5 text-muted">{summary.note}</Text>}
      </View>

      <View className="gap-4">
        {mix.stops.map((stop, i) => (
          <View key={`${stop.store_name}-${i}`} className="gap-2 border-t border-line pt-4">
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1 gap-1">
                <Text className="font-sans-medium text-xs text-muted">{`Parada ${i + 1}`}</Text>
                <ChainPill name={stop.store_name} color={stop.chain_color} />
              </View>
              <Text className="font-display-extrabold text-xl text-ink" style={tabularNums}>
                {money(stop.subtotal)}
              </Text>
            </View>
            <View className="gap-2">
              {stop.items.map((it) => (
                <View key={it.slug} className="gap-1">
                  <View className="flex-row items-start justify-between gap-3">
                    <Text numberOfLines={2} className="min-w-0 flex-1 font-sans text-sm text-ink">
                      {itemName(quote.items, it.slug)}
                      {it.qty > 1 ? ` ×${it.qty}` : ''}
                    </Text>
                    <Text className="font-sans-semibold text-sm text-ink" style={tabularNums}>
                      {money(it.unit_price * it.qty)}
                    </Text>
                  </View>
                  <SourceTag source={it.source} />
                </View>
              ))}
            </View>
            {stop.store && (
              <View className="items-start">
                <Button
                  title="Cómo llegar"
                  variant="secondary"
                  accessibilityLabel={`Cómo llegar a ${stop.store.name}`}
                  icon={<Navigation size={18} color={colors.ink} />}
                  onPress={() => void openDirections({ lat: stop.store!.lat, lng: stop.store!.lng, name: stop.store!.name })}
                />
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
