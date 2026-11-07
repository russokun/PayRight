import { useRouter } from 'expo-router';
import { BookmarkCheck, ChevronRight, Share2, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartLineRow } from '@/components/cart/CartLineRow';
import { LocationHint } from '@/components/cart/LocationHint';
import { QuoteSummary } from '@/components/cart/QuoteSummary';
import { Button, EmptyState, Notice } from '@/components/ui';
import { useCartQuote } from '@/lib/api/cart-queries';
import { useMeta } from '@/lib/api/queries';
import { distinctCount, unitsCount, type CartLine } from '@/lib/cart/cart';
import { shareMessage, summaryLine } from '@/lib/cart/quote-view';
import { useCartStore } from '@/store/useCartStore';
import { useSavedListsStore } from '@/store/useSavedListsStore';
import { useTheme } from '@/theme/useTheme';

const keyOf = (l: CartLine) => l.slug;

/** Carrito: tu lista en el dispositivo, y debajo cuánto cuesta en cada cadena (la cotiza el servidor, sin guardar nada). */
export default function CarritoScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const meta = useMeta();
  const { query, lines } = useCartQuote();
  const pruned = useCartStore((s) => s.pruned);
  const dismissPruned = useCartStore((s) => s.dismissPruned);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const savedCount = useSavedListsStore((s) => s.lists.length);
  const [confirmClear, setConfirmClear] = useState(false);

  const quote = query.data;
  const stale = query.isPlaceholderData;
  const share = stale ? null : shareMessage(quote);
  const units = unitsCount(lines);
  const products = distinctCount(lines);

  const openProduct = useCallback(
    (slug: string) => router.push({ pathname: '/producto/[slug]', params: { slug } }),
    [router],
  );
  const changeQty = useCallback(
    (slug: string, qty: number) => {
      setQty(slug, qty);
    },
    [setQty],
  );
  const removeLine = useCallback((slug: string) => remove(slug), [remove]);

  const onShare = useCallback(async () => {
    if (!share) return;
    try {
      await Share.share({ message: share });
    } catch {
      // sin hoja para compartir (p. ej. en el navegador): no hay nada más que hacer
    }
  }, [share]);

  const renderLine = useCallback(
    ({ item }: { item: CartLine }) => (
      <CartLineRow line={item} onOpen={openProduct} onQty={changeQty} onRemove={removeLine} />
    ),
    [openProduct, changeQty, removeLine],
  );

  const savedLink = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={savedCount > 0 ? `Listas guardadas, ${savedCount}` : 'Guardar o abrir listas'}
      onPress={() => router.push('/listas')}
      className="min-h-11 flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 active:bg-surface-2"
    >
      <BookmarkCheck size={20} color={colors.ink} />
      <View className="min-w-0 flex-1">
        <Text className="font-sans-bold text-base text-ink">Listas guardadas</Text>
        <Text className="font-sans text-sm text-muted">
          {savedCount > 0
            ? `${savedCount} ${savedCount === 1 ? 'lista' : 'listas'} · reutiliza una compra anterior`
            : 'Guarda tu carrito con un nombre y reutilízalo'}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );

  if (lines.length === 0) {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top + 8 }}>
        <View className="gap-4 px-4 pt-2">
          <Text accessibilityRole="header" className="font-display-extrabold text-3xl text-ink">
            Tu carrito
          </Text>
          {pruned.length > 0 && <PrunedNotice pruned={pruned} onDismiss={dismissPruned} />}
          <EmptyState
            title="Tu carrito está vacío"
            hint="Busca productos y toca «Agregar al carrito». PayRight te dice en qué supermercado sale más barata tu lista."
          />
          <Button title="Buscar productos" onPress={() => router.navigate('/')} />
          {savedLink}
        </View>
      </View>
    );
  }

  const header = (
    <View className="gap-3 pb-1">
      <View className="gap-1">
        <Text accessibilityRole="header" className="font-display-extrabold text-3xl text-ink">
          Tu carrito
        </Text>
        <Text className="font-sans text-sm text-muted">
          {products} {products === 1 ? 'producto' : 'productos'}
          {units !== products ? ` · ${units} unidades` : ''}
        </Text>
      </View>
      {meta.data?.is_demo ? (
        <Notice tone="demo">Datos de demostración: los precios que ves son de ejemplo, no de las tiendas.</Notice>
      ) : null}
      {pruned.length > 0 && <PrunedNotice pruned={pruned} onDismiss={dismissPruned} />}
      <LocationHint />
    </View>
  );

  const footer = (
    <View className="gap-5 pt-4">
      <QuoteSummary
        quote={quote}
        stale={stale}
        loading={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
      />
      <View className="gap-3">
        {share ? (
          <Button
            title="Compartir mi lista"
            variant="secondary"
            icon={<Share2 size={18} color={colors.ink} />}
            onPress={() => void onShare()}
          />
        ) : null}
        {savedLink}
        {confirmClear ? (
          <View className="gap-3 rounded-2xl border border-alert/40 bg-alert-bg p-4">
            <Text className="font-sans-semibold text-base leading-5 text-ink">
              ¿Vaciar el carrito? Se quitan {products} {products === 1 ? 'producto' : 'productos'}.
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <Button
                title="Sí, vaciar"
                onPress={() => {
                  clear();
                  setConfirmClear(false);
                }}
              />
              <Button title="Cancelar" variant="secondary" onPress={() => setConfirmClear(false)} />
            </View>
          </View>
        ) : (
          <Button
            title="Vaciar carrito"
            variant="ghost"
            icon={<Trash2 size={18} color={colors.ink} />}
            onPress={() => setConfirmClear(true)}
          />
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top + 8 }}>
      <FlatList
        data={lines}
        keyExtractor={keyOf}
        renderItem={renderLine}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 12 }}
      />
      <View className="gap-2 border-t border-line bg-surface px-4 py-3">
        <Text
          accessibilityLiveRegion="polite"
          numberOfLines={2}
          className="font-sans-semibold text-sm leading-5 text-ink"
        >
          {stale
            ? 'Actualizando los totales…'
            : quote
              ? summaryLine(quote)
              : query.isError
                ? 'No pudimos calcular los totales todavía.'
                : 'Calculando dónde te sale más barato…'}
        </Text>
        <Button title="Ver la cotización" variant="accent" onPress={() => router.push('/cotizar')} />
      </View>
    </View>
  );
}

function PrunedNotice({ pruned, onDismiss }: { pruned: CartLine[]; onDismiss: () => void }) {
  const names = pruned.map((l) => l.name).join(', ');
  return (
    <View className="gap-2">
      <Notice tone="warn">
        {pruned.length === 1
          ? `Quitamos 1 producto que ya no existe en PayRight: ${names}.`
          : `Quitamos ${pruned.length} productos que ya no existen en PayRight: ${names}.`}
      </Notice>
      <View className="items-start">
        <Button title="Entendido" variant="secondary" onPress={onDismiss} />
      </View>
    </View>
  );
}
