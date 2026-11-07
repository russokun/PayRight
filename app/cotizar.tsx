import { Stack, useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, Navigation } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { ChainCard } from '@/components/cart/ChainCard';
import { LocationHint } from '@/components/cart/LocationHint';
import { MixCard } from '@/components/cart/MixCard';
import { Button, ChainPill, EmptyState, ErrorState, LoadingList, Notice } from '@/components/ui';
import { useCartQuote } from '@/lib/api/cart-queries';
import { errorMessage } from '@/lib/api/errors';
import { useMeta } from '@/lib/api/queries';
import { absentLabel, headline, storeLabel, winnerOf } from '@/lib/cart/quote-view';
import { km, money } from '@/lib/format';
import { openDirections } from '@/lib/maps';
import { tabularNums } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';
import type { QuoteChainDTO, QuoteDTO } from '@/types/api';

const keyOf = (c: QuoteChainDTO) => c.slug;

/**
 * El ganador. Solo se llama «el más barato» a una cadena que tiene TODA la lista; si ninguna la tiene se dice así y no
 * se calcula ahorro (`headline` aplica la regla).
 */
function Banner({ quote }: { quote: QuoteDTO }) {
  const { colors } = useTheme();
  const w = winnerOf(quote);
  const h = headline(quote);
  if (!w || !h) return null;
  const { chain } = w;
  const store = chain.store;
  const winner = w.complete && quote.comparable;

  return (
    <View accessibilityRole="summary" className="gap-3 rounded-3xl bg-field p-5">
      {winner ? (
        <View className="self-start rounded-md bg-accent px-2 py-1">
          <Text className="font-sans-bold text-xs uppercase tracking-wider text-accent-ink">{h.kicker}</Text>
        </View>
      ) : (
        <Text accessibilityRole="header" className="font-display-extrabold text-2xl leading-7 text-field-ink">
          {h.kicker}
        </Text>
      )}

      {winner ? (
        <>
          <ChainPill name={chain.name} color={chain.color} />
          <Text className="font-display-extrabold text-5xl text-field-ink" style={tabularNums} maxFontSizeMultiplier={1.3}>
            {money(chain.total)}
          </Text>
          {h.saving && <Text className="font-sans-bold text-lg leading-6 text-field-ink">{h.saving}</Text>}
          {h.second && <Text className="font-sans text-sm leading-5 text-field-ink opacity-90">{h.second}</Text>}
        </>
      ) : (
        h.caveat && <Text className="font-sans text-base leading-6 text-field-ink">{h.caveat}</Text>
      )}
      {winner && h.caveat ? (
        <Text className="font-sans text-sm leading-5 text-field-ink opacity-90">{h.caveat}</Text>
      ) : null}

      {store ? (
        <View className="gap-2">
          <Text className="font-sans text-sm leading-5 text-field-ink opacity-90">
            {`En ${storeLabel(store, ', ')}${chain.distance_km != null ? ` · a ${km(chain.distance_km)}` : ''}`}
          </Text>
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
      ) : winner ? (
        <Text className="font-sans text-sm leading-5 text-field-ink opacity-90">Tienda en línea de {chain.name}.</Text>
      ) : null}
    </View>
  );
}

function HowWeCalculate() {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <View className="rounded-2xl border border-line bg-surface">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="¿Cómo calculamos esto?"
        onPress={() => setOpen((v) => !v)}
        className="min-h-12 flex-row items-center justify-between gap-3 px-4 active:opacity-70"
      >
        <Text className="font-sans-bold text-base text-ink">¿Cómo calculamos esto?</Text>
        <Chevron size={18} color={colors.muted} />
      </Pressable>
      {open && (
        <View className="gap-3 px-4 pb-4">
          <Text className="font-sans text-sm leading-5 text-muted">
            Para cada cadena sumamos el precio de cada producto por la cantidad que llevas, en el lugar más barato donde
            se puede comprar toda la lista de una vez: su tienda en línea o una sucursal con reportes recientes.
          </Text>
          <Text className="font-sans text-sm leading-5 text-muted">
            Gana la cadena que tiene <Text className="font-sans-bold text-ink">toda</Text> tu lista al menor total. Una
            cadena a la que le falta algún producto aparece con su total parcial y no entra en el ahorro, porque no se
            compara lo mismo. Tampoco usamos productos «parecidos»: si una cadena no tiene el mismo producto, aparece sin
            precio.
          </Text>
          <Text className="font-sans text-sm leading-5 text-muted">
            Los precios web son referenciales: los de la zona base de cada tienda, que al elegir tu dirección en su sitio
            pueden variar un poco. Cada uno dice de dónde viene: la web de la cadena o una foto de la comunidad.
          </Text>
        </View>
      )}
    </View>
  );
}

/** La cotización completa: el ganador, cada cadena de mejor a peor (con cada producto), la ruta mixta y cómo se calculó. */
export default function QuoteScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const meta = useMeta();
  const { query, lines, stale } = useCartQuote();
  const quote = query.data;
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = useCallback((slug: string) => setExpanded((cur) => (cur === slug ? null : slug)), []);

  const renderChain = useCallback(
    ({ item, index }: { item: QuoteChainDTO; index: number }) =>
      quote ? <ChainCard quote={quote} chain={item} index={index} expanded={expanded === item.slug} onToggle={toggle} /> : null,
    [quote, expanded, toggle],
  );

  const options = (
    <Stack.Screen
      options={{
        headerShown: true,
        title: 'Cotización',
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerTitleStyle: { color: colors.ink },
      }}
    />
  );

  if (lines.length === 0) {
    return (
      <View className="flex-1 gap-4 bg-bg px-4 pt-2">
        {options}
        <EmptyState
          title="Tu carrito está vacío"
          hint="Agrega productos y vuelve a cotizar: te diremos qué supermercado tiene tu lista más barata."
        />
        <Button title="Buscar productos" onPress={() => router.navigate('/')} />
      </View>
    );
  }

  if (!quote) {
    return (
      <View className="flex-1 bg-bg px-4 pt-2">
        {options}
        {query.isError ? (
          <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
        ) : (
          <View className="gap-3">
            <Text accessibilityLiveRegion="polite" className="font-sans-semibold text-base text-ink">
              Cotizando tu lista…
            </Text>
            <LoadingList count={3} />
          </View>
        )}
      </View>
    );
  }

  const cells = quote.chains.flatMap((c) => Object.values(c.cells));
  const hasPartner = cells.some((c) => c.source === 'partner');
  const hasCommunity = cells.some((c) => c.source === 'community');
  const absent = absentLabel(quote.absent);

  const header = (
    <View className="gap-4 pb-2">
      {meta.data?.is_demo ? (
        <Notice tone="demo">Datos de demostración: los precios que ves son de ejemplo, no de las tiendas.</Notice>
      ) : null}
      {query.isError ? (
        <View className="gap-2">
          <Notice tone="warn">No pudimos actualizar la cotización: estos totales pueden no ser los de ahora.</Notice>
          <View className="items-start">
            <Button title="Reintentar" variant="secondary" onPress={() => void query.refetch()} />
          </View>
        </View>
      ) : null}
      {stale ? (
        <Text accessibilityLiveRegion="polite" className="font-sans-semibold text-sm text-muted">
          Actualizando los totales…
        </Text>
      ) : null}
      {quote.chains.length === 0 ? (
        <EmptyState
          title="Todavía no hay precios para tu lista"
          hint="Ninguna cadena tiene precio vigente para estos productos. Vuelve más tarde o sube un precio con una foto de la etiqueta."
        />
      ) : (
        <>
          <Banner quote={quote} />
          {quote.location ? (
            <Text className="font-sans text-sm text-muted">{`Distancias desde ${quote.location.place}.`}</Text>
          ) : (
            <LocationHint />
          )}
          <View className="gap-1 pt-2">
            <Text accessibilityRole="header" className="font-display-extrabold text-xl text-ink">
              Tu lista en {quote.chains.length} {quote.chains.length === 1 ? 'cadena' : 'cadenas'}
            </Text>
            <Text className="font-sans text-sm text-muted">Toca una cadena para ver cada producto con su precio.</Text>
          </View>
        </>
      )}
    </View>
  );

  const footer = (
    <View className="gap-4 pt-4">
      {absent && <Text className="font-sans text-sm leading-5 text-muted">{absent}</Text>}
      <MixCard quote={quote} />
      {hasPartner && (
        <Text className="font-sans text-xs leading-4 text-muted">
          Precio web · referencial: llega por una fuente asociada, sin la fecha exacta en que se vio. Confírmalo en la
          tienda.
        </Text>
      )}
      {hasCommunity && (
        <Text className="font-sans text-xs leading-4 text-muted">
          Reporte de la comunidad: lo subió una persona desde una sucursal, con su foto.
        </Text>
      )}
      <HowWeCalculate />
    </View>
  );

  return (
    <View className="flex-1 bg-bg">
      {options}
      <FlatList
        data={quote.chains}
        keyExtractor={keyOf}
        renderItem={renderChain}
        extraData={expanded}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentInsetAdjustmentBehavior="automatic"
        style={{ opacity: stale ? 0.6 : 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 12 }}
      />
    </View>
  );
}
