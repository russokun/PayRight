import { Stack, useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { Button, EmptyState, Notice } from '@/components/ui';
import { capMessage, unitsCount } from '@/lib/cart/cart';
import { MAX_LISTS, MAX_NAME, loadList, saveMessage, type SavedList } from '@/lib/cart/lists';
import { timeAgo } from '@/lib/format';
import { useCartStore } from '@/store/useCartStore';
import { useSavedListsStore } from '@/store/useSavedListsStore';
import { useTheme } from '@/theme/useTheme';

type Pending = { id: string; kind: 'replace' | 'delete' } | null;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Listas guardadas por nombre (máx. 12), solo en este dispositivo: guardar el carrito, reutilizarlo y borrar. */
export default function ListsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const lines = useCartStore((s) => s.lines);
  const replaceCart = useCartStore((s) => s.replace);
  const mergeCart = useCartStore((s) => s.merge);
  const clearCart = useCartStore((s) => s.clear);
  const lists = useSavedListsStore((s) => s.lists);
  const save = useSavedListsStore((s) => s.save);
  const removeList = useSavedListsStore((s) => s.remove);

  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const goToCart = useCallback(() => router.navigate('/carrito'), [router]);

  const onSave = (startOver: boolean) => {
    const status = save(name, lines);
    if (status === 'saved' || status === 'replaced') {
      setName('');
      const extra = saveMessage(status);
      setMessage({ tone: 'ok', text: `Lista guardada.${extra ? ` ${extra}` : ''}` });
      if (startOver) clearCart();
    } else {
      setMessage({ tone: 'warn', text: saveMessage(status) ?? 'No pudimos guardar la lista.' });
    }
  };

  const applyList = (list: SavedList) => {
    replaceCart(loadList(lines, list, 'replace').lines);
    setPending(null);
    goToCart();
  };

  const sumList = (list: SavedList) => {
    const r = mergeCart(list.lines);
    setPending(null);
    if (r.dropped > 0 || r.status === 'qty_capped') {
      const text =
        r.dropped > 0
          ? `Sumamos «${list.name}», pero ${plural(r.dropped, 'producto no cupo', 'productos no cupieron')}: ${capMessage('full')}`
          : `Sumamos «${list.name}». ${capMessage('qty_capped')}`;
      setMessage({ tone: 'warn', text });
      return;
    }
    goToCart();
  };

  const header = (
    <View className="gap-4 pb-2">
      <View className="gap-3 rounded-2xl border border-line bg-surface p-4">
        <Text accessibilityRole="header" className="font-display-extrabold text-xl text-ink">
          Guardar tu carrito
        </Text>
        {lines.length === 0 ? (
          <Text className="font-sans text-sm leading-5 text-muted">
            Tu carrito está vacío. Agrega productos y vuelve para guardarlo como lista.
          </Text>
        ) : (
          <>
            <Text className="font-sans text-sm leading-5 text-muted">
              {plural(lines.length, 'producto', 'productos')} ({plural(unitsCount(lines), 'unidad', 'unidades')}). Ponle
              un nombre para reutilizarla cuando quieras.
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={MAX_NAME}
              placeholder="Ej: Compra del mes"
              placeholderTextColor={colors.muted}
              selectionColor={colors.primary}
              returnKeyType="done"
              onSubmitEditing={() => onSave(false)}
              accessibilityLabel="Nombre de la lista"
              className={`min-h-12 rounded-full border bg-bg px-5 py-3 font-sans-semibold text-base text-ink ${focused ? 'border-primary' : 'border-line'}`}
              style={{ outlineWidth: 0 }}
            />
            <Button title="Guardar lista" onPress={() => onSave(false)} />
            <Button title="Guardar y empezar otra" variant="secondary" onPress={() => onSave(true)} />
          </>
        )}
        {message ? <Notice tone={message.tone === 'ok' ? 'info' : 'warn'}>{message.text}</Notice> : null}
      </View>
      <Text accessibilityRole="header" className="font-display-extrabold text-xl text-ink">
        {`Tus listas (${lists.length} de ${MAX_LISTS})`}
      </Text>
    </View>
  );

  const renderList = ({ item }: { item: SavedList }) => {
    const units = unitsCount(item.lines);
    const confirmReplace = pending?.id === item.id && pending.kind === 'replace';
    const confirmDelete = pending?.id === item.id && pending.kind === 'delete';
    return (
      <View className="gap-3 rounded-2xl border border-line bg-surface p-4">
        <View className="gap-0.5">
          <Text numberOfLines={2} className="font-sans-bold text-base leading-5 text-ink">
            {item.name}
          </Text>
          <Text className="font-sans text-sm text-muted">
            {plural(item.lines.length, 'producto', 'productos')}
            {units !== item.lines.length ? ` · ${plural(units, 'unidad', 'unidades')}` : ''} · guardada{' '}
            {timeAgo(item.saved_at)}
          </Text>
          <Text numberOfLines={2} className="font-sans text-xs leading-4 text-muted">
            {item.lines.map((l) => (l.qty > 1 ? `${l.name} ×${l.qty}` : l.name)).join(' · ')}
          </Text>
        </View>

        {confirmReplace ? (
          <View className="gap-3 rounded-xl border border-line bg-surface-2 p-3">
            <Text className="font-sans-semibold text-sm leading-5 text-ink">
              Esto reemplaza tu carrito actual ({plural(lines.length, 'producto', 'productos')}).
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <Button title="Sí, reemplazar" onPress={() => applyList(item)} />
              <Button title="Cancelar" variant="secondary" onPress={() => setPending(null)} />
            </View>
          </View>
        ) : confirmDelete ? (
          <View className="gap-3 rounded-xl border border-alert/40 bg-alert-bg p-3">
            <Text className="font-sans-semibold text-sm leading-5 text-ink">¿Borrar «{item.name}»?</Text>
            <View className="flex-row flex-wrap gap-3">
              <Button
                title="Sí, borrar"
                onPress={() => {
                  removeList(item.id);
                  setPending(null);
                }}
              />
              <Button title="Cancelar" variant="secondary" onPress={() => setPending(null)} />
            </View>
          </View>
        ) : (
          <View className="flex-row flex-wrap items-center gap-2">
            <Button
              title="Usar esta lista"
              accessibilityLabel={`Usar la lista ${item.name}`}
              onPress={() => (lines.length === 0 ? applyList(item) : setPending({ id: item.id, kind: 'replace' }))}
            />
            {lines.length > 0 && (
              <Button
                title="Sumar al carrito"
                variant="secondary"
                accessibilityLabel={`Sumar la lista ${item.name} a tu carrito`}
                onPress={() => sumList(item)}
              />
            )}
            <Button
              title="Borrar"
              variant="ghost"
              accessibilityLabel={`Borrar la lista ${item.name}`}
              icon={<Trash2 size={16} color={colors.ink} />}
              onPress={() => setPending({ id: item.id, kind: 'delete' })}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Listas guardadas',
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerTitleStyle: { color: colors.ink },
        }}
      />
      <FlatList
        data={lists}
        keyExtractor={(l) => l.id}
        renderItem={renderList}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 12 }}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            title="Aún no guardas ninguna lista"
            hint={`Guarda tu carrito con un nombre (hasta ${MAX_LISTS} listas) y reutilízalo el próximo mes. Quedan solo en este teléfono.`}
          />
        }
      />
    </View>
  );
}
